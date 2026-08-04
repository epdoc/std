import * as Cmd from '@epdoc/cmd';
import type { DateTime } from '@epdoc/datetime';
import * as FS from '@epdoc/fs/fs';
import { _ } from '@epdoc/type';
import { assert } from '@std/assert';
import { APP_NORMALIZE_RULES, CAMERA_MODEL_MAP } from './consts.ts';
import * as ExifDate from './date.ts';
import type { AudioInfo, Camera, FileId, ImageInfo, Metadata, VideoInfo } from './exif-schema.ts';
import * as Gps from './gps.ts';
import type { FileJson, IDryRun } from './types.ts';
import {
  parseBitrate,
  parseDuration,
  parseExposureTime,
  parseFileSize,
  parseFNumber,
  parseFocalLength,
  parseSubjectDistance,
} from './utils.ts';

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

    const isFile = await this.#file.isFile();
    if (!isFile) {
      return undefined;
    }
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
    const isVideo = this.#isVideo();
    const info = this.#file.info;
    const mimeType = this.metadata.MIMEType;
    return {
      file: {
        path: this.path,
        filename: this.#file.filename as string,
        createdAt: info.createdAt?.toISOString(),
        modifiedAt: info.modifiedAt?.toISOString(),
        size: info.size,
        type: this.#fileType(),
        mimeType,
      },
      ...(isVideo ? {} : { imageInfo: this.imageInfo }),
      ...(isVideo ? { video: this.video } : {}),
      ...(isVideo ? { audio: this.audio } : {}),
      digitizedAt: this.digitizedAt?.toISOString(),
      createdAt: this.createdAt?.toISOString(),
      modifiedAt: this.modifiedAt?.toISOString(),
      hasTimezone: this.hasTimezone,
      tzOffset: this.tzOffset,
      duration: this.duration,
      application: this.application,
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
    const m = this.metadata;
    const result: Camera = {};
    const name = this.#normalizeCameraName();
    if (name) result.name = name;
    if (m.Make) result.make = m.Make;
    if (name) result.name = name;
    if (m.Make) result.make = m.Make;
    if (m.Model) result.model = m.Model;
    if (m.LensMake) result.lensMake = m.LensMake;
    if (m.LensModel) result.lensModel = m.LensModel;
    if (m.SerialNumber) result.serialNumber = m.SerialNumber;
    if (m.MakerNote) result.makerNotes = m.MakerNote;
    if (m.FocalLengthIn35mmFormat) result.focalLength35mm = parseFocalLength(m.FocalLengthIn35mmFormat);
    return result;
  }

  set camera(value: Camera) {
    if (value.make !== undefined) this.#setTag('Make', value.make);
    if (value.model !== undefined) this.#setTag('Model', value.model);
    if (value.lensMake !== undefined) this.#setTag('LensMake', value.lensMake);
    if (value.lensModel !== undefined) this.#setTag('LensModel', value.lensModel);
    if (value.serialNumber !== undefined) this.#setTag('SerialNumber', value.serialNumber);
    if (value.makerNotes !== undefined) this.#setTag('MakerNote', value.makerNotes);
    if (value.focalLength35mm !== undefined) {
      const formattedNum = Number(value.focalLength35mm.toFixed(1));
      this.#setTag('FocalLengthIn35mmFormat', `${formattedNum} mm`);
    }
  }

  get imageInfo(): ImageInfo {
    const m = this.metadata;
    const result: ImageInfo = {};
    if (m.ExifImageWidth !== undefined) result.width = Number(m.ExifImageWidth);
    if (m.ExifImageHeight !== undefined) result.height = Number(m.ExifImageHeight);
    if (m.FileSize !== undefined) result.fileSize = parseFileSize(m.FileSize);
    if (m.MIMEType) result.mimeType = m.MIMEType;
    if (m.ColorSpace) result.colorSpace = m.ColorSpace;
    if (m.FNumber !== undefined) result.fNumber = parseFNumber(m.FNumber);
    if (m.Aperture !== undefined) result.fNumber = result.fNumber ?? parseFNumber(m.Aperture);
    if (m.ExposureTime !== undefined) result.exposureTime = parseExposureTime(m.ExposureTime);
    if (m.ISO !== undefined) result.iso = m.ISO;
    if (m.FocalLength !== undefined) result.focalLength = parseFocalLength(m.FocalLength);
    if (m.FocalLengthIn35mmFormat !== undefined) result.focalLength35mm = parseFocalLength(m.FocalLengthIn35mmFormat);
    if (m.SubjectDistance !== undefined) result.subjectDistance = parseSubjectDistance(m.SubjectDistance);
    return result;
  }

  get video(): VideoInfo {
    const m = this.metadata;
    const result: VideoInfo = {};
    if (m.ImageWidth !== undefined) result.width = Number(m.ImageWidth);
    if (m.ImageHeight !== undefined) result.height = Number(m.ImageHeight);
    if (m.SourceImageWidth !== undefined) result.sourceWidth = Number(m.SourceImageWidth);
    if (m.SourceImageHeight !== undefined) result.sourceHeight = Number(m.SourceImageHeight);
    if (m.Duration !== undefined) result.duration = parseDuration(m.Duration);
    if (m.CompressorID) result.codec = m.CompressorID;
    if (m.CompressorName) result.codecName = m.CompressorName;
    if (m.VideoFrameRate !== undefined) result.framerate = m.VideoFrameRate;
    if (m.BitDepth !== undefined) result.bitDepth = Number(m.BitDepth);
    if (m.ColorRepresentation) result.colorRepresentation = m.ColorRepresentation;
    if (m.PixelAspectRatio) result.pixelAspectRatio = m.PixelAspectRatio;
    if (m.Rotation !== undefined) result.rotation = m.Rotation;
    if (m.AvgBitrate !== undefined) result.avgBitrate = parseBitrate(m.AvgBitrate);
    if (m.MaxBitrate !== undefined) result.maxBitrate = parseBitrate(m.MaxBitrate);
    return result;
  }

  get audio(): AudioInfo {
    const m = this.metadata;
    const result: AudioInfo = {};
    if (m.AudioFormat) result.format = m.AudioFormat;
    if (m.AudioChannels !== undefined) result.channels = Number(m.AudioChannels);
    if (m.AudioSampleRate !== undefined) result.sampleRate = m.AudioSampleRate;
    if (m.AudioBitsPerSample !== undefined) result.bitsPerSample = Number(m.AudioBitsPerSample);
    if (m.MediaLanguageCode) result.language = m.MediaLanguageCode;
    return result;
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
   * The application that last edited this file, normalized from the Software
   * or CreatorTool metadata tags against {@link APP_NORMALIZE_RULES}.
   * Returns the normalized label when a rule matches, the raw Software value
   * when no rule matches, or `undefined` when no software tag is present.
   */
  get application(): string | undefined {
    const software = this.metadata.Software || this.metadata.CreatorTool;
    if (!software) return undefined;
    for (const rule of APP_NORMALIZE_RULES) {
      if (rule.pattern.test(software)) {
        return rule.label;
      }
    }
    return software;
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

  #isVideo(): boolean {
    return this.metadata.MIMEType?.startsWith('video/') ?? false;
  }

  #fileType(): string {
    const mime = this.metadata.MIMEType;
    if (!mime) return 'unknown';
    const mainType = mime.split('/')[0];
    return mainType || 'unknown';
  }

  #setTag(tag: string, value: string): void {
    this.#pending.set(tag, value);
    this.#dirty = true;
  }

  #normalizeCameraName(): string | undefined {
    const make = this.metadata.Make;
    const model = this.metadata.Model?.toUpperCase();
    if (make && model && CAMERA_MODEL_MAP[make] && CAMERA_MODEL_MAP[make][model]) {
      return `${make} ${CAMERA_MODEL_MAP[make][model]}`;
    }
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
