import * as Cmd from '@epdoc/cmd';
import * as FS from '@epdoc/fs/fs';
import { _ } from '@epdoc/type';
import { assert } from '@std/assert';
import * as Schema from './collections.ts';
import { collect, fileDef as FileDef } from './collections.ts';
import * as Gps from './gps.ts';
import type { Metadata } from './meta-types.ts';
import * as Meta from './meta/mod.ts';
import * as Normalize from './normalize.ts';
import type {
  Digest,
  FileGetMetadataOptions,
  FileInfo,
  FileInfoOptions,
  IDryRun,
  MetadataKey,
  MetadataValue,
  MetaModHistory,
  PendingMetaMod,
  WriteTag,
} from './types.ts';

/** Flags passed to exiftool for JSON reading with QuickTime UTC normalization. */
export const EXIFTOOL_READ_FLAGS = ['-j', '-struct', '-api', 'QuickTimeUTC=1'];

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
  app?: Schema.App;
};

/**
 * Wrapper around a single media file and its EXIF metadata.
 *
 * File objects are read-only until a setter is called. Setters accumulate
 * pending exiftool tag values in a Map; call {@link write} to apply them via
 * exiftool in one subprocess invocation. The Map structure is extensible and
 * supports arbitrary tags (GPS, location, etc.) through {@link setTag}.
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

  constructor(file: FS.FilePath | FS.File, opts?: IDryRun) {
    this.#fsFile = _.isString(file) ? new FS.File(file) : file;
    this.#dryRun = opts?.dryRun ?? false;
  }

  static from(file: FS.FilePath | FS.File, opts?: IDryRun): File {
    return new File(file, opts);
  }

  get fsFile(): FS.File {
    return this.#fsFile;
  }

  get path(): FS.FilePath {
    return this.#fsFile.path;
  }

  get metadata(): Metadata {
    assert(
      this.#metadata,
      `File ${this.path} has no metadata; call getMetadata() first`,
    );
    return this.#metadata;
  }

  get resolver(): Meta.Resolver {
    assert(
      this.#resolver,
      `File ${this.path} has no metadata; call getMetadata() first`,
    );
    return this.#resolver;
  }

  get dirty(): boolean {
    return this.#dirty;
  }

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
   * @params opts
   * @params opts.force Refreshes metadata with a new call to exiftool
   * @params opts.digest Generate a digest. Specify the digest or use default if true.
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
   * Construct a File from pre-loaded metadata .
   */
  static fromMetadata(metadata: Metadata, opts?: IDryRun): File {
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
   * populated sections (file, image, video, audio, doc, camera, app, gps).
   *
   * @param opts.metadata Set to true to include the raw {@link Metadata} object.
   */
  info(opts: FileInfoOptions = {}): FileInfo {
    assert(
      this.#metadata,
      'Metadata must be retrieved before calling this method',
    );
    if (this.#info) return this.#info;
    const result: FileInfo = {
      file: collect(FileDef, this.#fsFile, this.metadata),
    };
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
    if (opts.metadata) result.metadata = this.metadata;

    this.#info = result;
    return result;
  }

  get file(): Schema.File {
    if (this.#cache.file) return this.#cache.file;
    this.#cache.file = collect(Schema.fileDef, this.#fsFile, this.metadata);
    return this.#cache.file;
  }

  get image(): Schema.Image | undefined {
    if (this.#cache.image) return this.#cache.image;
    if (this.resolver.type !== 'image') return undefined;
    const result = collect(Schema.imageDef, this.#fsFile, this.metadata);
    if (result && Object.keys(result).length) {
      this.#cache.image = result;
    }
    return this.#cache.image;
  }

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

  get audio(): Schema.Audio | undefined {
    if (this.#cache.audio) return this.#cache.audio;
    const result = collect(Schema.audioDef, this.#fsFile, this.metadata);
    if (result && Object.keys(result).length) {
      this.#cache.audio = result;
    }
    return this.#cache.audio;
  }

  get doc(): Schema.Doc | undefined {
    if (this.#cache.doc) return this.#cache.doc;
    const result = collect(Schema.docDef, this.#fsFile, this.metadata);
    if (result && Object.keys(result).length) {
      this.#cache.doc = result;
    }
    return this.#cache.doc;
  }

  get pdf(): Schema.Pdf | undefined {
    if (this.#cache.pdf) return this.#cache.pdf;
    const result = collect(Schema.pdfDef, this.#fsFile, this.metadata);
    if (result && Object.keys(result).length) {
      this.#cache.pdf = result;
    }
    return this.#cache.pdf;
  }

  get camera(): Schema.Camera | undefined {
    if (this.#cache.camera) return this.#cache.camera;
    const result = collect(Schema.cameraDef, this.#fsFile, this.metadata);
    if (result && Object.keys(result).length) {
      this.#cache.camera = result;
    }
    return this.#cache.camera;
  }

  setCamera(value: Schema.Camera) {
    if (value.make !== undefined) this.#setTag('Make', value.make);
    if (value.model !== undefined) this.#setTag('Model', value.model);
    if (value.lensMake !== undefined) this.#setTag('LensMake', value.lensMake);
    if (value.lensModel !== undefined) {
      this.#setTag('LensModel', value.lensModel);
    }
    if (value.serialNumber !== undefined) {
      this.#setTag('SerialNumber', value.serialNumber);
    }
    if (value.makerNotes !== undefined) {
      this.#setTag('MakerNote', value.makerNotes);
    }
    if (value.focalLength35mm !== undefined) {
      const formattedNum = Number(value.focalLength35mm.toFixed(1));
      this.#setTag('FocalLengthIn35mmFormat', `${formattedNum} mm`);
    }
  }

  get app(): Schema.App | undefined {
    if (this.#cache.app) return this.#cache.app;
    const result = collect(Schema.appDef, this.#fsFile, this.metadata);
    if (result && Object.keys(result).length) {
      this.#cache.app = result;
    }
    return this.#cache.app;
  }

  toJSON(opts: { metadata: boolean }): FileInfo {
    return this.info(opts);
  }

  // ============================================================================
  // GPS
  // ============================================================================

  hasGps(): boolean {
    return _.isDefined(this.metadata.GPSLatitude) &&
      _.isDefined(this.metadata.GPSLongitude);
  }

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
   * Converts decimal coordinates into the exact tag-value record needed by ExifTool.
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

  // ============================================================================
  // File IDs
  // ============================================================================

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

  get pending(): Map<WriteTag, MetadataValue> {
    return this.#pending;
  }

  /**
   * Queue an arbitrary exiftool tag write.
   *
   * Pass `undefined` as the value to delete the tag. This is the extension
   * point for GPS, location, keywords, or any other tag not covered by the
   * typed setters.
   */
  setTag(tag: WriteTag, value: MetadataValue | undefined): void {
    if (value === undefined) {
      this.#setTag(tag, '');
    } else {
      this.#setTag(tag, value);
    }
  }

  /**
   * Merge a changeset (tag→value map) from {@link Meta.Resolver} into the
   * pending tag buffer. Empty-string values delete the corresponding tag.
   */
  applyTags(changes: PendingMetaMod): void {
    for (const [tag, value] of Object.entries(changes)) {
      this.#setTag(tag as WriteTag, value);
    }
  }

  /**
   * Apply all pending changes to the file via exiftool.
   *
   * This is a no-op when nothing is dirty. After a successful write the dirty
   * flag is cleared, pending tags are dropped, and cached metadata is
   * invalidated.
   */
  async write(): Promise<MetaModHistory[]> {
    if (!this.#dirty) return [];

    const prev = this.#metadata;
    const diffs: MetaModHistory[] = [];
    const args = ['-overwrite_original', '-P', '-m'];
    for (const [tag, value] of this.#pending) {
      const previousValue = prev ? prev[metadataKeyOf(tag)] as MetadataValue : undefined;
      const diff: MetaModHistory = { tag, value, previousValue };
      diffs.push(diff);
      args.push(`-${tag}=${value}`);
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
   * Also writes a `Software` tag identifying the source platform.
   *
   * In dry-run mode the changeset is computed and queued but the exiftool
   * write is a no-op, leaving {@link pending} populated so callers can report
   * the changes.
   *
   * @returns true when a repair changeset was applied (or queued in dry-run).
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
    const changes: PendingMetaMod = resolver.repairDates(fsDate);
    if (!Object.keys(changes).length) return [];

    const source = resolver.source;
    if (source === 'whatsapp' && this.#metadata?.Software !== 'WhatsApp') {
      changes['Software'] = 'WhatsApp';
    } else if (
      source === 'tiktok' && this.#metadata?.Software !== 'TikTok'
    ) {
      changes['Software'] = 'TikTok';
    }

    this.applyTags(changes);
    return this.write();
  }

  #cmd(args?: string[]): Cmd.Runner<Record<string, unknown>> {
    return Cmd.runner<Record<string, unknown>>('exiftool', args).dryRun(
      this.#dryRun,
    ).cwd(FS.cwd());
  }

  #setTag(tag: WriteTag, value: MetadataValue): void {
    this.#pending.set(tag, value);
    this.#dirty = true;
  }
}

/**
 * Map a write tag back to the read-model key it corresponds to.
 * Group-prefixed specs such as `XMP-dc:Date` read back as their short name
 * (`Date`); plain tags map to themselves. Note the read model is flattened by
 * exiftool's group priority, so the previous value found for a group-prefixed
 * tag is the priority-winning group's value, not necessarily the exact group
 * being written.
 */
function metadataKeyOf(tag: WriteTag): MetadataKey {
  const i = tag.lastIndexOf(':');
  return (i >= 0 ? tag.slice(i + 1) : tag) as MetadataKey;
}
