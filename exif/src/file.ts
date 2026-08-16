import * as Cmd from '@epdoc/cmd';
import * as FS from '@epdoc/fs/fs';
import { _ } from '@epdoc/type';
import { assert } from '@std/assert';
import * as Schema from './collections.ts';
import { collect } from './collections.ts';
import { REPAIRABLE } from './consts.ts';
import * as Geo from './geo/mod.ts';
import * as Gps from './gps.ts';
import type { Metadata } from './meta-types.ts';
import * as Meta from './meta/mod.ts';
import * as Normalize from './normalize.ts';
import type {
  Digest,
  FileGetMetadataOptions,
  FileInfo,
  FileInfoOptions,
  FileOptions,
  MetadataKey,
  MetadataValue,
  MetaModHistory,
  MetaTagDict,
  WriteTag,
} from './types.ts';

/**
 * Flags passed to exiftool for JSON reading with QuickTime UTC normalization.
 *
 * `-j` emits JSON, `-struct` preserves nested structures, and
 * `QuickTimeUTC=1` interprets QuickTime timestamps as UTC.
 */
export const EXIFTOOL_READ_FLAGS = ['-j', '-struct', '-api', 'QuickTimeUTC=1'];

/**
 * Flags passed to exiftool for tag writes.
 *
 * `-overwrite_original` edits in place, `-P` preserves file timestamps, `-m`
 * ignores minor errors, `-charset utf8` sets the charset, and `-use MWG`
 * enables the Metadata Working Group group (so MWG:City etc. sync EXIF, IPTC
 * and XMP).
 */
export const EXIFTOOL_WRITE_FLAGS = [
  '-overwrite_original',
  '-P',
  '-m',
  '-charset',
  'utf8',
  '-use',
  'MWG',
];

type MetaCache = {
  file?: Schema.File;
  digest?: Digest;
  video?: Schema.Video;
  image?: Schema.Image;
  audio?: Schema.Audio;
  camera?: Schema.Camera;
  pdf?: Schema.Pdf;
  doc?: Schema.Doc;
  gps?: Gps.Location;
  address?: Geo.AddressDef;
  lookup?: Geo.AddressDef;
  app?: Schema.App;
};

/**
 * Wrapper around a single media file and its EXIF metadata.
 *
 * File objects are read-only until a setter is called. Setters accumulate
 * pending exiftool tag values in a Map; call {@link write} to apply them via
 * exiftool in one subprocess invocation. The Map structure is extensible and
 * supports arbitrary tags (GPS, location, etc.) through {@link setTag}.
 *
 * Setting a tag to the same value already present in the file's metadata is a
 * no-op: the tag is not queued and the {@link dirty} flag stays `false`. This
 * keeps `write()` writes minimal and makes the setters idempotent.
 */
export class File {
  #fsFile: FS.File;
  #metadata?: Metadata;
  #info?: FileInfo;
  #cache: MetaCache = {};
  #resolver?: Meta.Resolver;
  #dryRun: boolean;
  #dirty = false;
  #pending = new Map<WriteTag, MetadataValue>();
  #api?: Geo.AddressLookup;
  #address?: Geo.AddressDef;

  /**
   * Create a File for the given media file.
   *
   * No exiftool call is made until {@link getMetadata} is invoked.
   *
   * @param file An absolute/relative path or an existing {@link FS.File}.
   * @param [opts.dryRun=false] When true, {@link write} and {@link repair}
   *   compute and report their changesets without invoking the exiftool binary.
   * @param opts.userAgent Required if using a location service. In the form '@scope/pkg@version'
   */
  constructor(file: FS.FilePath | FS.File, opts?: FileOptions) {
    this.#fsFile = _.isString(file) ? new FS.File(file) : file;
    this.#dryRun = opts?.dryRun ?? false;
    if (opts && opts.userAgent) {
      this.#api = new Geo.AddressLookup(opts.userAgent);
    }
  }

  /** Create a File for the given media file. @see {@link constructor}. */
  static from(file: FS.FilePath | FS.File, opts?: FileOptions): File {
    return new File(file, opts);
  }

  initLookup(userAgent: string): void {
    this.#api = new Geo.AddressLookup(userAgent);
  }

  /** The underlying {@link FS.File} this wrapper reads/writes. */
  get fsFile(): FS.File {
    return this.#fsFile;
  }

  /** The absolute path of the media file. */
  get path(): FS.FilePath {
    return this.#fsFile.path;
  }

  /**
   * The raw exiftool metadata object.
   *
   * @throws When metadata has not been loaded; call {@link getMetadata} first.
   */
  get metadata(): Metadata {
    assert(
      this.#metadata,
      `File ${this.path} has no metadata; call getMetadata() first`,
    );
    return this.#metadata;
  }

  /**
   * The media-agnostic {@link Meta.Resolver} built from the loaded metadata.
   *
   * @throws When metadata has not been loaded; call {@link getMetadata} first.
   */
  get resolver(): Meta.Resolver {
    assert(
      this.#resolver,
      `File ${this.path} has no metadata; call getMetadata() first`,
    );
    return this.#resolver;
  }

  /**
   * True when queued tag writes have not yet been applied to the file.
   *
   * Setters leave this `false` when the queued value matches the value already
   * in the file's metadata, so it is a reliable signal for "needs a write".
   */
  get dirty(): boolean {
    return this.#dirty;
  }

  /** The reverse-geocoding lookup used by {@link lookupAddress}. */
  get api(): Geo.AddressLookup {
    assert(
      this.#api,
      'Address lookup is not enabled because userAgent was not provided when creating this interface',
    );
    return this.#api;
  }

  /**
   * Compute (and cache) a content digest of the file.
   *
   * The digest is cached after the first call and reused by {@link info} via
   * the `digest` option.
   *
   * @param alg The digest algorithm (default `sha1`).
   * @returns `"<alg>:<hex>"`, e.g. `"sha1:da39a3ee5e6b4b0d..."`.
   */
  async getDigest(
    alg: FS.DigestAlgorithmValues = FS.DigestAlgorithm.sha1,
  ): Promise<Digest> {
    if (!this.#cache.digest) {
      this.#cache.digest = alg + ':' + await this.#fsFile.digest(alg);
    }
    return this.#cache.digest;
  }

  /**
   * Read JSON metadata from the file via exiftool.
   *
   * Dates are read in canonical EXIF form (`YYYY:MM:DD HH:MM:SS`) so that
   * missing timezones can be distinguished from explicit UTC offsets.
   * The result is cached; pass `force` to re-read from disk.
   *
   * @returns The raw metadata, or `undefined` when the file does not exist or
   *   exiftool returns no output.
   * @param [opts.force=false] Refresh the metadata with a new exiftool call.
   * @param [opts.digest] Compute a digest; the string names the algorithm,
   *   `true` uses the default.
   */
  async getMetadata(
    opts: FileGetMetadataOptions = {},
  ): Promise<Metadata | undefined> {
    if (this.#metadata && !opts.force) return this.#metadata;

    const isFile = await this.#fsFile.isFile();
    if (!isFile) {
      return undefined;
    }
    const args = [...EXIFTOOL_READ_FLAGS, this.path];
    const result = await this.#cmd(args).run();

    if (!result.success) {
      throw new Error(
        result.stderr.trim() || `exiftool exited with code ${result.exitCode}`,
      );
    }

    const trimmed = result.stdout.trim();
    if (!trimmed) {
      this.#metadata = undefined;
      return;
    } else {
      const parsed = JSON.parse(trimmed);
      const meta: Metadata = _.isArray(parsed) ? parsed[0] : parsed;
      this.#metadata = meta;
      this.#resolver = new Meta.Resolver(meta);
      return meta;
    }
  }

  /**
   * Construct a File from pre-loaded metadata.
   *
   * The metadata is adopted as-is (no exiftool call) and used as the read
   * model for the skip-if-unchanged write logic.
   *
   * @param metadata The raw exiftool metadata for the file. Must include
   *   `SourceFile`; its value is used as the file path.
   * @param [opts.dryRun=false] When true, {@link write} and {@link repair}
   *   are no-ops on the binary.
   */
  static fromMetadata(metadata: Metadata, opts?: FileOptions): File {
    const file = new File(metadata.SourceFile, opts);
    file.#metadata = metadata;
    file.#resolver = new Meta.Resolver(metadata);
    return file;
  }

  // ============================================================================
  // Info section getters (def-driven SSoT)
  // ============================================================================

  /**
   * Return the full structured info object for this file. Includes all
   * populated sections (file, image, video, audio, doc, camera, app, gps)
   * plus any cached address/lookup data. The result is cached.
   *
   * @param [opts.metadata=false] Set to true to include the raw
   *   {@link Metadata} object.
   * @param [opts.digest=false] Compute and include a file digest.
   * @param [opts.address=false] Include the reverse-geocoded address when
   *   previously looked up.
   */
  info(opts: FileInfoOptions = {}): FileInfo {
    assert(
      this.#metadata,
      'Metadata must be retrieved before calling this method',
    );
    if (this.#info) return this.#info;
    const result: FileInfo = { file: this.file };
    if (this.#cache.digest) {
      result.file.digest = this.#cache.digest;
    }
    const id = this.id();
    if (id) result.id = id;
    if (this.camera && Object.keys(this.camera).length) {
      result.camera = this.camera;
    }
    if (this.app && Object.keys(this.app).length) result.app = this.app;
    const type = this.resolver.type;
    if (type === 'image') {
      if (this.image && Object.keys(this.image).length) {
        result.image = this.image;
      }
    } else if (type === 'video') {
      if (this.video && Object.keys(this.video).length) {
        result.video = this.video;
      }
      if (this.audio && Object.keys(this.audio).length) {
        if (
          Object.keys(this.audio).length !== 1 ||
          this.audio.codec !== Normalize.CODEC_AUDIO_UNKNOWN
        ) {
          result.audio = this.audio;
        }
      }
    } else if (type === 'audio') {
      if (this.audio && Object.keys(this.audio).length) {
        if (
          Object.keys(this.audio).length !== 1 ||
          this.audio.codec !== Normalize.CODEC_AUDIO_UNKNOWN
        ) {
          result.audio = this.audio;
        }
      }
    } else {
      if (this.pdf && Object.keys(this.pdf).length) result.pdf = this.pdf;
      if (!this.pdf) {
        if (this.doc && Object.keys(this.doc).length) result.doc = this.doc;
      }
    }
    if (this.gps && Object.keys(this.gps)) result.gps = this.gps;
    if (this.address && Object.keys(this.address).length) {
      result.address = this.address;
    }
    if (this.lookup && Object.keys(this.lookup).length) {
      result.lookup = this.lookup;
    }

    if (opts.metadata) result.metadata = this.metadata;

    this.#info = result;
    return result;
  }

  /** Filesystem-level info (path, size, FS dates) collected from file stats. */
  get file(): Schema.File {
    if (this.#cache.file) return this.#cache.file;
    this.#cache.file = collect(Schema.fileDef, this.#fsFile, this.metadata);
    return this.#cache.file;
  }

  /**
   * Image-specific fields (width, height, capture dates, f-number, ISO,
   * focal length, ...). Returns `undefined` for non-image files or when no
   * image fields are populated.
   */
  get image(): Schema.Image | undefined {
    if (this.#cache.image) return this.#cache.image;
    if (this.resolver.type !== 'image') return undefined;
    const result = collect(Schema.imageDef, this.#fsFile, this.metadata);
    if (result && Object.keys(result).length) {
      this.#cache.image = result;
    }
    return this.#cache.image;
  }

  /**
   * Video-specific fields (resolution, duration, codec, rotation, ...).
   * Returns `undefined` for non-video files or when no video fields exist.
   */
  get video(): Schema.Video | undefined {
    if (this.#cache.video) return this.#cache.video;
    if (this.resolver.type !== 'video') return undefined;
    const res: Normalize.VideoRes | undefined = Normalize.videoResolution(
      this.metadata,
    );
    const other: Schema.VideoOther = collect(
      Schema.videoOtherDef,
      this.#fsFile,
      this.metadata,
    );
    if (
      (res && Object.keys(res).length) || (other && Object.keys(other).length)
    ) {
      this.#cache.video = { ...res, ...other };
    }
    return this.#cache.video;
  }

  /**
   * Audio-specific fields (format, codec, sample rate, duration, ...).
   * Returns `undefined` when no audio fields are populated.
   */
  get audio(): Schema.Audio | undefined {
    if (this.#cache.audio) return this.#cache.audio;
    const result = collect(Schema.audioDef, this.#fsFile, this.metadata);
    if (result && Object.keys(result).length) {
      this.#cache.audio = result;
    }
    return this.#cache.audio;
  }

  /**
   * Document fields (title, author, subject, page count, ...) for non-PDF
   * documents. Returns `undefined` when no document fields are populated.
   */
  get doc(): Schema.Doc | undefined {
    if (this.#cache.doc) return this.#cache.doc;
    const result = collect(Schema.docDef, this.#fsFile, this.metadata);
    if (result && Object.keys(result).length) {
      this.#cache.doc = result;
    }
    return this.#cache.doc;
  }

  /**
   * PDF-specific fields (title, author, page count, producer, ...).
   * Returns `undefined` when no PDF fields are populated.
   */
  get pdf(): Schema.Pdf | undefined {
    if (this.#cache.pdf) return this.#cache.pdf;
    const result = collect(Schema.pdfDef, this.#fsFile, this.metadata);
    if (result && Object.keys(result).length) {
      this.#cache.pdf = result;
    }
    return this.#cache.pdf;
  }

  /** Camera info (make, model, lens, serial, maker notes, ...). */
  get camera(): Schema.Camera | undefined {
    if (this.#cache.camera) return this.#cache.camera;
    const result = collect(Schema.cameraDef, this.#fsFile, this.metadata);
    if (result && Object.keys(result).length) {
      this.#cache.camera = result;
    }
    return this.#cache.camera;
  }

  /**
   * Queue camera tag writes (make, model, lens, serial number, maker notes,
   * 35mm focal length) for this file. Only fields that are defined are set;
   * each write is skipped when the file already carries that value.
   *
   * @param value The camera values to write.
   */
  setCamera(value: Schema.Camera) {
    if (value.make !== undefined) this.#setTag('Make', value.make);
    if (value.model !== undefined) this.#setTag('Model', value.model);
    if (value.lensMake !== undefined) this.#setTag('LensMake', value.lensMake);
    if (value.lensModel !== undefined) {
      this.setTag('LensModel', value.lensModel);
    }
    if (value.serialNumber !== undefined) {
      this.setTag('SerialNumber', value.serialNumber);
    }
    if (value.makerNotes !== undefined) {
      this.setTag('MakerNote', value.makerNotes);
    }
    if (value.focalLength35mm !== undefined) {
      const formattedNum = Number(value.focalLength35mm.toFixed(1));
      this.setTag('FocalLengthIn35mmFormat', `${formattedNum} mm`);
    }
  }

  /**
   * App-level info: the last software that processed the file (`editor`) and
   * the detected source producer (`producer`).
   */
  get app(): Schema.App | undefined {
    if (this.#cache.app) return this.#cache.app;
    const result = collect(Schema.appDef, this.#fsFile, this.metadata);
    if (result && Object.keys(result).length) {
      this.#cache.app = result;
    }
    return this.#cache.app;
  }

  /** JSON serialization of {@link info}. */
  toJSON(opts: { metadata: boolean }): FileInfo {
    return this.info(opts);
  }

  // ============================================================================
  // GPS
  // ============================================================================

  /** True when the file carries both GPS latitude and longitude. */
  hasGps(): boolean {
    return _.isDefined(this.metadata.GPSLatitude) &&
      _.isDefined(this.metadata.GPSLongitude);
  }

  /** Decimal GPS coordinates parsed from the metadata, when present. */
  get gps(): Gps.Location | undefined {
    if (this.#cache.gps) return this.#cache.gps;
    const lat = Gps.parse(
      this.metadata.GPSLatitude,
      this.metadata.GPSLatitudeRef,
    );
    const lng = Gps.parse(
      this.metadata.GPSLongitude,
      this.metadata.GPSLongitudeRef,
    );
    if (lat === undefined || lng === undefined) return undefined;

    const alt = this.metadata?.GPSAltitude !== undefined
      ? _.isNumber(this.metadata.GPSAltitude)
        ? this.metadata.GPSAltitude
        : parseFloat(String(this.metadata.GPSAltitude).replace(/[^-\d.]/g, ''))
      : undefined;

    this.#cache.gps = { lat, lng, alt };

    return this.#cache.gps;
  }

  /**
   * Queue GPS coordinate writes for this file.
   *
   * Lat/lng are converted to exiftool DMS strings with the given second
   * precision (default 2); when altitude is provided the altitude and
   * above/below-sea-level reference are queued too. Each write is skipped when
   * the file already carries that value.
   *
   * @param location Decimal coordinates and optional altitude (meters).
   * @param [options.secondPrecision=2] Decimal places for the DMS seconds.
   * @throws When `lat` or `lng` is not a number.
   */
  setGPS(location: Gps.Location, options?: Gps.Options): void {
    if (!_.isNumber(location.lat) || !_.isNumber(location.lng)) {
      throw new Error('GPS location must include numeric lat and lng');
    }

    const secondPrecision = options?.secondPrecision ?? 2;
    const latDms: Gps.Dms = Gps.toDms(location.lat, 'lat', secondPrecision);
    const lngDms: Gps.Dms = Gps.toDms(location.lng, 'lng', secondPrecision);

    this.setTag('GPSLatitude', latDms.dms);
    this.setTag('GPSLatitudeRef', latDms.ref);
    this.setTag('GPSLongitude', lngDms.dms);
    this.setTag('GPSLongitudeRef', lngDms.ref);
    if (_.isNumber(location.alt)) {
      this.setTag('GPSAltitude', Math.abs(location.alt).toString());
      this.setTag(
        'GPSAltitudeRef',
        location.alt < 0 ? 'Below Sea Level' : 'Above Sea Level',
      );
    }
  }

  get address(): Geo.AddressDef | undefined {
    if (this.#cache.address) return this.#cache.address;
    const result = this.resolver.getAddressDef();
    if (result && Object.keys(result).length) {
      this.#cache.address = result;
    }
    return this.#cache.address;
  }

  get lookup(): Geo.AddressDef | undefined {
    // We need to pre-fetch this if we want it as part of info
    return this.#cache.lookup;
  }

  /**
   * Reverse-geocode the file's GPS coordinates via {@link Geo.AddressLookup}.
   *
   * Requires a prior {@link getMetadata} call (and GPS coordinates in the
   * metadata). The result is cached and returned.
   *
   * @param userAgent The Nominatim User-Agent header, e.g. `"myapp/1.2.3"`.
   *   Nominatim requires an identifying user agent.
   * @returns The structured address, or `undefined` when the file has no GPS.
   */
  async lookupAddress(): Promise<Geo.AddressDef | undefined> {
    if (this.#cache.lookup) return this.#cache.lookup;
    if (!this.gps) return;
    await this.api.lookup(this.gps.lat, this.gps.lng);
    this.#cache.lookup = this.api.address;
    return this.#cache.lookup;
  }

  /**
   * Queue EXIF location tag writes from the last address lookup.
   *
   * The detail level controls which tags are written (country → state →
   * county → city → sublocation → exact). No-op when no lookup has been
   * performed. Each write is skipped when the file already carries that value,
   * unless `force` is set.
   *
   * The `MWG:City` tag combines settlement (village/town/city) with county;
   * the `MWG:Location` tag holds the sublocation (neighbourhood/suburb), with
   * the street address prepended at {@link Geo.Level.exact}.
   *
   * @param [granularity=Geo.Level.sublocation] How much location detail to write.
   * @param [force=false] When true, queue every location tag even if it
   *   matches the read model. Use this to guarantee the MWG location tags are
   *   written to all target groups (e.g. normalizing a file whose groups hold
   *   inconsistent values).
   */
  setAddressFromLookup(
    granularity: Geo.LevelType = Geo.Level.sublocation,
    force = false,
  ): MetaTagDict {
    const tags: MetaTagDict = this.api.getTags(granularity);
    this.applyTags(tags, force);
    return tags;
  }

  // ============================================================================
  // File IDs
  // ============================================================================

  /** The XMP document/instance IDs from the metadata, when present. */
  id(): Schema.FileId | undefined {
    const m = this.metadata;
    if (m.DocumentID || m.InstanceID) {
      const result: Schema.FileId = {};
      if (m.DocumentID) result.documentId = m.DocumentID;
      if (m.InstanceID) result.instanceId = m.InstanceID;
      return result;
    }
    return undefined;
  }

  // ============================================================================
  // MakerNotes
  // ============================================================================

  /**
   * The binary MakerNote block for the file, when present.
   */
  get makerNotes(): string | undefined {
    return this.metadata?.MakerNote;
  }

  // ============================================================================
  // Tag access & write
  // ============================================================================

  /**
   * The map of tag→value writes queued for the next {@link write}.
   *
   * Group-prefixed specs (e.g. `MWG:City`) may appear as keys. Empty-string
   * values represent deletions. This map is a live reference; mutate it
   * directly only if you know what you are doing.
   */
  get pending(): Map<WriteTag, MetadataValue> {
    return this.#pending;
  }

  /**
   * Queue an arbitrary exiftool tag write.
   *
   * Pass `undefined` as the value to delete the tag. This is the extension
   * point for GPS, location, keywords, or any other tag not covered by the
   * typed setters.
   *
   * When the value matches the tag's current value in the file metadata the
   * write is skipped and the file stays clean (idempotent). Values are
   * compared as strings, with an absent tag and `''` treated as equivalent.
   *
   * @param tag The tag to write, or a group-prefixed spec such as `MWG:City`.
   * @param value The new value; `undefined` deletes the tag.
   * @param [force=false] When true, queue the write even if the value already
   *   matches the read model. Use this to guarantee a group-prefixed write
   *   (e.g. `MWG:City`, `XMP-dc:Date`) lands in the targeted group(s), which
   *   is useful when the flat read value may come from a different group than
   *   the one being written.
   */
  setTag(tag: WriteTag, value: MetadataValue | undefined, force = false): void {
    if (value === undefined) {
      this.#setTag(tag, '', force);
    } else {
      this.#setTag(tag, value, force);
    }
  }

  /**
   * Merge a changeset (tag→value map) from {@link Meta.Resolver} or
   * {@link Geo.AddressLookup} into the pending tag buffer.
   *
   * Empty-string values delete the corresponding tag. Each tag is subject to
   * the same skip-if-unchanged logic as {@link setTag}; pass `force` to queue
   * every entry unconditionally.
   *
   * @param changes The tag→value map to queue.
   * @param [force=false] When true, queue every entry even if it matches the
   *   read model (see {@link setTag}).
   */
  applyTags(changes: MetaTagDict, force = false): void {
    for (const [tag, value] of Object.entries(changes)) {
      this.#setTag(tag as WriteTag, value, force);
    }
  }

  /**
   * Apply all pending changes to the file via exiftool.
   *
   * This is a no-op when nothing is dirty. After a successful write the dirty
   * flag is cleared, pending tags are dropped, and cached metadata is
   * invalidated.
   *
   * @returns A report of the queued changes as {@link MetaModHistory} records
   *   (`tag`, `value`, and best-effort `previousValue` from the cached read
   *   metadata). Empty when nothing was queued. Because {@link setTag} skips
   *   values that already match the file, each record is a genuine change.
   */
  async write(): Promise<MetaModHistory[]> {
    if (!this.#dirty) return [];

    const prev = this.#metadata;
    const diffs: MetaModHistory[] = [];
    const args = EXIFTOOL_WRITE_FLAGS;
    for (const [tag, value] of this.#pending) {
      const previousValue = prev ? (prev[metadataKeyOf(tag)] as MetadataValue) : undefined;
      const diff: MetaModHistory = { tag, value, previousValue };
      diffs.push(diff);

      // 2. Safely handle null/undefined so ExifTool clears the tag instead of writing "undefined"
      if (value === undefined || value === null) {
        args.push(`-${tag}=`);
      } else {
        args.push(`-${tag}=${value}`);
      }
    }
    args.push(this.#fsFile.path);

    if (!this.#dryRun) {
      const result = await this.#cmd(args).run();
      if (!result.success) {
        throw new Error(
          result.stderr.trim() ||
            `exiftool write failed with code ${result.exitCode}`,
        );
      }
    }

    this.#pending.clear();
    this.#dirty = false;
    this.#metadata = undefined;
    return diffs;
  }

  /**
   * Repair missing or corrupted date metadata for files whose source platform
   * stripped the embedded dates (e.g. TikTok, WhatsApp).
   *
   * Uses the filesystem modified/created timestamp as the replacement date,
   * with the filename timestamp preferred for WhatsApp `DateTimeOriginal`.
   * Also writes a `Software` tag identifying the source platform; the write is
   * skipped automatically when the tag already carries that value.
   *
   * In dry-run mode the changeset is computed and queued but the exiftool
   * write is a no-op, leaving {@link pending} populated so callers can report
   * the changes.
   *
   * @returns A {@link MetaModHistory} report of the queued changes, or an
   *   empty array when the file needs no repair.
   */
  async repair(): Promise<MetaModHistory[]> {
    const resolver = this.#resolver;
    if (!resolver) return [];

    if (!this.#fsFile.hasInfo()) {
      await this.#fsFile.stats();
    }
    const fsDate = this.#fsFile.hasInfo()
      ? (this.#fsFile.info.modifiedAt ?? this.#fsFile.info.createdAt ??
        undefined)
      : undefined;
    const changes: MetaTagDict = resolver.repairDates(fsDate);
    if (!Object.keys(changes).length) return [];

    const producer = resolver.producer;
    if (producer && REPAIRABLE.includes(producer)) {
      changes['Software'] = producer;
    }

    this.applyTags(changes);
    return this.write();
  }

  #cmd(args?: string[]): Cmd.Runner<Record<string, unknown>> {
    return Cmd.runner<Record<string, unknown>>('exiftool', args).dryRun(
      this.#dryRun,
    ).cwd(FS.cwd());
  }

  /**
   * Queue a tag write unless it would not change the file.
   *
   * A write is skipped when the new value equals the value that would
   * actually be written: the value already queued for the tag if any, else
   * the value last read from the file. Values are compared as strings with
   * `undefined` and `''` treated as absent, so setting an absent tag to `''`
   * (a delete) is a no-op, and re-setting a tag to its current value leaves
   * the file clean.
   *
   * When `force` is set the comparison is skipped and the write is always
   * queued. This guarantees the tag is written even when the flat read value
   * matches but may come from a different metadata group than the one being
   * targeted (see {@link metadataKeyOf}).
   *
   * @param tag The tag to write.
   * @param value The new value.
   * @param [force=false] Queue the write unconditionally.
   */
  #setTag(tag: WriteTag, value: MetadataValue, force = false): void {
    if (!force) {
      const queued = this.#pending.has(tag)
        ? this.#pending.get(tag)
        : (this.#metadata?.[metadataKeyOf(tag)] as MetadataValue | undefined);
      if (String(queued ?? '') === String(value ?? '')) return;
    }
    this.#pending.set(tag, value);
    this.#dirty = true;
  }
}

/**
 * Map a write tag back to the read-model key it corresponds to.
 *
 * Group-prefixed specs such as `XMP-dc:Date` read back as their short name
 * (`Date`); plain tags map to themselves. Note the read model is flattened by
 * exiftool's group priority, so the previous value found for a group-prefixed
 * tag is the priority-winning group's value, not necessarily the exact group
 * being written. This is used for both the skip-if-unchanged comparison and
 * the `previousValue` report in {@link File.write}.
 */
function metadataKeyOf(tag: WriteTag): MetadataKey {
  const i = tag.lastIndexOf(':');
  return (i >= 0 ? tag.slice(i + 1) : tag) as MetadataKey;
}
