import * as Cmd from '@epdoc/cmd';
import type { DateTime } from '@epdoc/datetime';
import * as FS from '@epdoc/fs/fs';
import { _ } from '@epdoc/type';
import { assert } from '@std/assert';
import * as ExifDate from './date.ts';
import type { Camera, FileId, Metadata } from './exif-schema.ts';
import * as Gps from './gps.ts';
import type { FileJson, IDryRun } from './types.ts';
import { parseDuration } from './utils.ts';

export const EXIFTOOL_READ_FLAGS = ['-j', '-struct', '-api', 'QuickTimeUTC=1'];

/**
 * Wrapper around a single media file and its EXIF metadata.
 *
 * File objects are read-only until a setter is called. Setters accumulate
 * pending exiftool tag values in a Map; call {@link write} to apply them via
 * exiftool in one subprocess invocation. The Map structure is extensible and
 * supports arbitrary tags (GPS, location, etc.) through {@link setTag}.
 */
export class File {
  #file: FS.File;
  #metadata?: Metadata;
  #dryRun: boolean;
  #dirty = false;
  #pending = new Map<string, string>();

  constructor(file: FS.FilePath | FS.File, opts?: IDryRun) {
    this.#file = _.isString(file) ? new FS.File(file) : file;
    this.#dryRun = opts?.dryRun ?? false;
  }

  get file(): FS.File {
    return this.#file;
  }

  get path(): FS.FilePath {
    return this.#file.path;
  }

  get metadata(): Metadata {
    assert(this.#metadata, `File ${this.path} has no metadata; call getMetadata() first`);
    return this.#metadata;
  }

  get dirty(): boolean {
    return this.#dirty;
  }

  /**
   * Read JSON metadata from the file via exiftool.
   *
   * Dates are read in canonical EXIF form (`YYYY:MM:DD HH:MM:SS`) so that
   * missing timezones can be distinguished from explicit UTC offsets.
   */
  async getMetadata(opts: { force?: boolean } = {}): Promise<Metadata | undefined> {
    if (this.#metadata && !opts.force) return this.#metadata;

    const args = [...EXIFTOOL_READ_FLAGS, this.path];
    const result = await this.#cmd(args).run();

    if (!result.success) {
      throw new Error(result.stderr.trim() || `exiftool exited with code ${result.exitCode}`);
    }

    const trimmed = result.stdout.trim();
    if (!trimmed) {
      this.#metadata = undefined;
    } else {
      const parsed = JSON.parse(trimmed);
      this.#metadata = _.isArray(parsed) ? parsed[0] : parsed;
    }
    return this.#metadata;
  }

  static fromMetadata(metadata: Metadata, opts?: IDryRun): File {
    const file = new File(metadata.SourceFile, opts);
    file.#metadata = metadata;
    return file;
  }

  toJSON(): FileJson {
    return {
      file: this.path,
      digitizedAt: this.digitizedAt?.toISOString(),
      createdAt: this.createdAt?.toISOString(),
      modifiedAt: this.modifiedAt?.toISOString(),
      hasTimezone: this.hasTimezone,
      tzOffset: this.tzOffset,
      duration: this.duration,
      camera: this.camera,
      gps: this.gps,
      id: this.id,
    };
  }

  /**
   * Returns the most accurate creation timestamp available.
   *
   * Priority: DateTimeOriginal → CreateDate / DateCreated.
   */
  get createdAt(): DateTime | undefined {
    return ExifDate.getCreated(this.metadata);
  }

  /**
   * Returns the digitization timestamp.
   *
   * Uses CreateDate / DateCreated (with SubSecCreateDate when present).
   */
  get digitizedAt(): DateTime | undefined {
    return ExifDate.getDigitized(this.metadata);
  }

  /**
   * Returns the most accurate modification timestamp available.
   *
   * Priority: ModifyDate → FileModifyDate → FileInodeChangeDate → FileAccessDate.
   */
  get modifiedAt(): DateTime | undefined {
    return ExifDate.getModified(this.metadata);
  }

  /**
   * True when the primary creation date carries an explicit timezone offset.
   * Falls back to false when no creation date is present.
   */
  get hasTimezone(): boolean {
    return this.createdAt?.hasTimezone() ?? false;
  }

  /**
   * The timezone offset of the primary creation date, if one is present.
   * Returns `undefined` when there is no creation date or no timezone.
   */
  get tzOffset(): string | undefined {
    return this.createdAt?.getTzString();
  }

  /**
   * Set the creation timestamp and its associated sub-second and offset tags.
   *
   * @param datetime - The new creation date/time. ZonedDateTime values write
   *   their wall-clock time and offset; PlainDateTime values write no offset;
   *   Instant values are interpreted as UTC.
   */
  setCreatedAt(datetime: DateTime): void {
    this.#setDateTags('DateTimeOriginal', 'SubSecTimeOriginal', 'OffsetTimeOriginal', datetime);
  }

  /**
   * Set the modification timestamp and its associated sub-second and offset tags.
   */
  setModifiedAt(datetime: DateTime): void {
    this.#setDateTags('ModifyDate', 'SubSecTime', 'OffsetTime', datetime);
  }

  /**
   * Set the digitization timestamp (CreateDate) and its associated sub-second
   * and offset tags.
   */
  setDigitizedAt(datetime: DateTime): void {
    this.#setDateTags('CreateDate', 'SubSecTimeDigitized', 'OffsetTimeDigitized', datetime);
  }

  /**
   * Set all date/time tags to the same value.
   */
  setAllDates(datetime: DateTime): void {
    this.#setDateTags('DateTimeOriginal', 'SubSecTimeOriginal', 'OffsetTimeOriginal', datetime);
    this.#setDateTags('CreateDate', 'SubSecTimeDigitized', 'OffsetTimeDigitized', datetime);
    this.#setDateTags('ModifyDate', 'SubSecTime', 'OffsetTime', datetime);
  }

  /**
   * Set the timezone offset tags without changing the wall-clock date/time values.
   *
   * @param offset - An ISO 8601 offset such as `"+02:00"`, `"-06:00"`, or `"Z"`.
   */
  setTimezoneOffset(offset: string): void {
    const normalized = this.#normalizeOffset(offset);
    this.#setTag('OffsetTimeOriginal', normalized);
    this.#setTag('OffsetTimeDigitized', normalized);
    this.#setTag('OffsetTime', normalized);
  }

  /**
   * The video/media duration in seconds, when available in the metadata.
   */
  get duration(): number | undefined {
    return parseDuration(this.metadata.Duration);
  }

  get camera(): Camera {
    return {
      make: this.metadata?.Make,
      model: this.metadata?.Model,
      lensModel: this.metadata?.LensModel,
      software: this.metadata?.Software,
      creatorTool: this.metadata?.CreatorTool,
      serialNumber: this.metadata?.SerialNumber,
      makerNotes: this.metadata?.MakerNote,
    };
  }

  set camera(value: Camera) {
    if (value.make !== undefined) this.#setTag('Make', value.make);
    if (value.model !== undefined) this.#setTag('Model', value.model);
    if (value.lensModel !== undefined) this.#setTag('LensModel', value.lensModel);
    if (value.software !== undefined) this.#setTag('Software', value.software);
    if (value.creatorTool !== undefined) this.#setTag('CreatorTool', value.creatorTool);
    if (value.serialNumber !== undefined) this.#setTag('SerialNumber', value.serialNumber);
    if (value.makerNotes !== undefined) this.#setTag('MakerNote', value.makerNotes);
  }

  /**
   * The binary MakerNote block for the file, when present.
   */
  get makerNotes(): string | undefined {
    return this.metadata?.MakerNote;
  }

  hasGps(): boolean {
    return _.isDefined(this.metadata.GPSLatitude) && _.isDefined(this.metadata.GPSLongitude);
  }

  get gps(): Gps.Location | undefined {
    const lat = Gps.parse(this.metadata.GPSLatitude, this.metadata.GPSLatitudeRef);
    const lng = Gps.parse(this.metadata.GPSLongitude, this.metadata.GPSLongitudeRef);
    if (lat === undefined || lng === undefined) return undefined;

    const alt = this.metadata?.GPSAltitude !== undefined
      ? _.isNumber(this.metadata.GPSAltitude)
        ? this.metadata.GPSAltitude
        : parseFloat(String(this.metadata.GPSAltitude).replace(/[^-\d.]/g, ''))
      : undefined;

    return { lat, lng, alt };
  }

  /**
   * Converts decimal coordinates into the exact tag-value record needed by ExifTool.
   *
   * @param location - Object containing lat, lng, and optional alt
   * @param options - Formatting options
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
      this.setTag('GPSAltitudeRef', location.alt < 0 ? 'Below Sea Level' : 'Above Sea Level');
    }
  }

  get id(): FileId {
    const result: FileId = {};
    if (this.metadata.DocumentID) result.documentId = this.metadata.DocumentID;
    if (this.metadata.InstanceID) result.instanceId = this.metadata.InstanceID;
    return result;
  }

  /**
   * Queue an arbitrary exiftool tag write.
   *
   * Pass `undefined` as the value to delete the tag. This is the extension
   * point for GPS, location, keywords, or any other tag not covered by the
   * typed setters.
   */
  setTag(tag: string, value: string | undefined): void {
    if (value === undefined) {
      this.#setTag(tag, '');
    } else {
      this.#setTag(tag, value);
    }
  }

  /**
   * Apply all pending changes to the file via exiftool.
   *
   * This is a no-op when nothing is dirty. After a successful write the dirty
   * flag is cleared, pending tags are dropped, and cached metadata is
   * invalidated.
   */
  async write(): Promise<void> {
    if (!this.#dirty) return;

    const args = ['-overwrite_original', '-P', '-m'];
    for (const [tag, value] of this.#pending) {
      args.push(`-${tag}=${value}`);
    }
    args.push(this.#file.path);

    const result = await this.#cmd(args).run();
    if (!result.success && !this.#dryRun) {
      throw new Error(result.stderr.trim() || `exiftool write failed with code ${result.exitCode}`);
    }

    this.#pending.clear();
    this.#dirty = false;
    this.#metadata = undefined;
  }

  #cmd(args?: string[]): Cmd.Runner<Record<string, unknown>> {
    return Cmd.runner<Record<string, unknown>>('exiftool', args).dryRun(this.#dryRun).cwd(FS.cwd());
  }

  #setTag(tag: string, value: string): void {
    this.#pending.set(tag, value);
    this.#dirty = true;
  }

  #normalizeOffset(offset: string): string {
    const trimmed = offset.trim();
    const withColon = trimmed.replace(/^([+-]\d{2})(\d{2})$/, '$1:$2');
    if (!/^(?:[+-]\d{2}:\d{2}|Z)$/i.test(withColon)) {
      throw new Error(`Invalid timezone offset format: "${offset}". Expected "+HH:MM", "-HH:MM", or "Z".`);
    }
    return withColon === 'Z' || withColon === 'z' ? '+00:00' : withColon;
  }

  #setDateTags(dateTag: string, subSecTag: string, offsetTag: string, dt: DateTime): void {
    this.#setTag(dateTag, ExifDate.formatDateTime(dt));

    const ms = dt.millisecond;
    this.#setTag(subSecTag, ms > 0 ? String(ms).padStart(3, '0') : '');

    if (dt.hasTimezone()) {
      const offset = dt.getTzString();
      if (offset) this.#setTag(offsetTag, offset);
    } else if (dt.temporal instanceof Temporal.Instant) {
      this.#setTag(offsetTag, '+00:00');
    } else {
      this.#setTag(offsetTag, '');
    }
  }
}
