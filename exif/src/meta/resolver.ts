import { DateTime, type ISOTZ } from '@epdoc/datetime';
import { _, type Integer } from '@epdoc/type';
import type { Metadata } from '../meta-types.ts';
import * as Normalize from '../normalize.ts';
import * as Parse from './parse.ts';
import type { Parts } from './types.ts';

function fromParts(parts: Parts): DateTime {
  const dt = DateTime.fromComponents(
    parts.year,
    parts.month,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    parts.millisecond ?? 0,
  );
  if (parts.tzOffset) dt.setTz(parts.tzOffset as ISOTZ);
  return dt;
}

function isUninitializedSentinel(parts: Parts): boolean {
  if (parts.year <= 0) return true;

  if (
    parts.year === 1904 &&
    parts.month === 1 &&
    parts.day === 1 &&
    parts.hour === 0 &&
    parts.minute === 0 &&
    parts.second === 0
  ) {
    return true;
  }

  if (
    parts.year === 1970 &&
    parts.month === 1 &&
    parts.day === 1 &&
    parts.hour === 0 &&
    parts.minute === 0 &&
    parts.second === 0
  ) {
    return true;
  }

  return false;
}

/**
 * Class returns media-agnostic values from Metadata. For example, regardless of whether this is
 * a video or image file, it will return the width and height. Or regardless of whether this is a
 * video or audio fie it will return the duration. Or regardless of the file type it will return
 * it's best knowledge of the originateAt date.
 */
export class Resolver {
  /** The raw exiftool metadata being resolved. */
  meta: Metadata;
  constructor(meta: Metadata) {
    this.meta = meta;
  }

  static from(meta: Metadata): Resolver {
    return new Resolver(meta);
  }

  // ==========================================================================
  // Static utilities
  // ==========================================================================

  /**
   * Build a {@link DateTime} from EXIF date tags.
   *
   * @param base The primary date tag (e.g. `CreateDate`, `DateTimeOriginal`),
   *             in exiftool's `"YYYY:MM:DD HH:MM:SS"` format.
   * @param subSec A separate sub-second tag (e.g. `SubSecTimeOriginal`), used when
   *               the base value carries no fractional second.
   * @param offset A separate timezone-offset tag (e.g. `OffsetTimeOriginal`), used
   *               when the base value carries no timezone.
   */
  static buildDateTime(
    base: string | undefined,
    subSec?: string | number,
    offset?: string,
  ): DateTime | undefined {
    const parts = Parse.dateString(base);
    if (!parts) return undefined;

    if (isUninitializedSentinel(parts)) return undefined;

    let milliseconds = parts.millisecond;
    if (milliseconds === undefined && subSec !== undefined) {
      milliseconds = Parse.milliseconds(subSec);
    }
    let tzOffset = parts.tzOffset;
    if (!tzOffset && offset) tzOffset = Normalize.tzOffset(offset);

    return fromParts({ ...parts, millisecond: milliseconds, tzOffset });
  }

  /**
   * Format a {@link DateTime} as exiftool's canonical `YYYY:MM:DD HH:MM:SS` string.
   *
   * - ZonedDateTime uses the wall-clock time in its timezone.
   * - PlainDateTime uses its wall-clock time.
   * - Instant is interpreted as UTC.
   */
  static toExifDateTimeString(dt: DateTime): string {
    if (dt.temporal instanceof Temporal.Instant) {
      return dt.withTz('utc').format('yyyy:MM:dd HH:mm:ss');
    }
    return dt.format('yyyy:MM:dd HH:mm:ss');
  }

  private static normalizeOffset(offset: string): string {
    const trimmed = offset.trim();
    const withColon = trimmed.replace(/^([+-]\d{2})(\d{2})$/, '$1:$2');
    if (!/^(?:[+-]\d{2}:\d{2}|Z)$/i.test(withColon)) {
      throw new Error(`Invalid timezone offset format: "${offset}". Expected "+HH:MM", "-HH:MM", or "Z".`);
    }
    return withColon === 'Z' || withColon === 'z' ? '+00:00' : withColon;
  }

  private static prepareDateTags(
    dateTag: string,
    subSecTag: string,
    offsetTag: string,
    dt: DateTime,
  ): Record<string, string> {
    const changes: Record<string, string> = {};
    changes[dateTag] = Resolver.toExifDateTimeString(dt);

    const ms = dt.millisecond;
    changes[subSecTag] = ms > 0 ? String(ms).padStart(3, '0') : '';

    if (dt.hasTimezone()) {
      const offset = dt.getTzString();
      if (offset) changes[offsetTag] = offset;
    } else if (dt.temporal instanceof Temporal.Instant) {
      changes[offsetTag] = '+00:00';
    } else {
      changes[offsetTag] = '';
    }
    return changes;
  }

  // ==========================================================================
  // Read methods
  // ==========================================================================

  /**
   * Return the top-level MIME type category (e.g. `"image"`, `"video"`, `"audio"`,
   * `"application"`) from the file's MIMEType.
   */
  type(): string | undefined {
    return this.meta.MIMEType?.split('/')[0] ?? undefined;
  }

  /**
   * Return the creation date/time from an EXIF metadata object.
   *
   * Alias/Wrapper for getOriginal with fallback to Digitized or OS File Dates.
   */
  createdAt(): DateTime | undefined {
    return this.originatedAt() ?? this.digitizedAt();
  }

  /**
   * Return the original capture/recording date/time from internal metadata.
   * Checks EXIF, QuickTime Keys/UserData (videos), XMP, IPTC, and GPS.
   */
  originatedAt(): DateTime | undefined {
    const meta = this.meta;
    return (
      Resolver.buildDateTime(meta.SubSecDateTimeOriginal) ??
        Resolver.buildDateTime(
          meta.DateTimeOriginal,
          meta.SubSecTimeOriginal,
          meta.OffsetTimeOriginal,
        ) ??
        Resolver.buildDateTime(meta.CreationDate) ??
        Resolver.buildDateTime(meta.DateCreated) ??
        Resolver.buildDateTime(meta.GPSDateTime)
    );
  }

  /**
   * Return the digitization date/time (CreateDate / DigitalCreationDateTime).
   */
  digitizedAt(): DateTime | undefined {
    const meta = this.meta;
    return (
      Resolver.buildDateTime(meta.SubSecCreateDate) ??
        Resolver.buildDateTime(
          meta.CreateDate,
          meta.SubSecTimeDigitized,
          meta.OffsetTimeDigitized,
        ) ??
        Resolver.buildDateTime(meta.TrackCreateDate) ??
        Resolver.buildDateTime(meta.MediaCreateDate) ??
        Resolver.buildDateTime(meta.DigitalCreationDateTime) ??
        Resolver.buildDateTime(meta.DigitalCreationDate) ??
        this.originatedAt()
    );
  }

  /**
   * Return the metadata modification date/time.
   */
  modifiedAt(): DateTime | undefined {
    const meta = this.meta;
    return (
      Resolver.buildDateTime(
        meta.SubSecModifyDate ?? meta.ModifyDate,
        meta.SubSecTime,
        meta.OffsetTime,
      ) ??
        Resolver.buildDateTime(meta.TrackModifyDate) ??
        Resolver.buildDateTime(meta.MediaModifyDate) ??
        Resolver.buildDateTime(meta.MetadataDate)
    );
  }

  /**
   * Return the "primary" date/time from an EXIF metadata object, in priority order:
   * original (DateTimeOriginal) → digitized (CreateDate) → modified (ModifyDate).
   */
  primary(): DateTime | undefined {
    return this.createdAt() ?? this.modifiedAt();
  }

  /**
   * True when the primary creation date carries an explicit timezone offset.
   * Falls back to false when no creation date is present.
   */
  get hasTimezone(): boolean {
    return this.createdAt()?.hasTimezone() ?? false;
  }

  /**
   * The timezone offset of the primary creation date, if one is present.
   */
  get tzOffset(): string | undefined {
    return this.createdAt()?.getTzString();
  }

  /**
   * Returns the width of the content
   */
  width(): Integer | undefined {
    const m = this.meta;
    return asInt(m.ExifImageWidth) ?? asInt(m.ImageWidth) ?? asInt(m.SourceImageWidth) ?? undefined;
  }

  /**
   * Returns the height of the content
   */
  height(): Integer | undefined {
    const m = this.meta;
    return asInt(m.ExifImageHeight) ?? asInt(m.ImageHeight) ?? asInt(m.SourceImageHeight) ?? undefined;
  }

  /**
   * Returns the duration of the video or audio file.
   */
  duration(): number | undefined {
    const m = this.meta;
    return Parse.duration(m.Duration) ??
      Parse.duration(m.MediaDuration) ??
      Parse.duration(m.AudioDuration) ??
      Parse.duration(m.TrackDuration) ?? undefined;
  }

  /**
   * Return the codec(s) used by the file. For images this is the encoding
   * process; for video/audio this is the video and/or audio codec,
   * semicolon-separated.
   */
  codec(): string | undefined {
    const m = this.meta;
    const codec: string[] = [];
    if (this.type() === 'image') {
      if (m.EncodingProcess) codec.push(m.EncodingProcess);
    } else if (this.type() === 'video' || this.type() === 'audio') {
      const videoCodec = Normalize.videoCodec(m);
      const audioCodec = Normalize.audioCodec(m);
      if (videoCodec) codec.push(videoCodec);
      if (audioCodec) codec.push(audioCodec);
    }
    if (codec.length) return codec.join('; ');
    return;
  }

  // ==========================================================================
  // Write-prepare methods (return changeset to apply via File.applyTags)
  // ==========================================================================

  /**
   * Return tag changes for setting the original capture date/time.
   * Writes to DateTimeOriginal, SubSecTimeOriginal, OffsetTimeOriginal.
   */
  setOriginatedAt(dt: DateTime): Record<string, string> {
    return Resolver.prepareDateTags('DateTimeOriginal', 'SubSecTimeOriginal', 'OffsetTimeOriginal', dt);
  }

  /**
   * Return tag changes for setting the digitization date/time.
   * Writes to CreateDate, SubSecTimeDigitized, OffsetTimeDigitized.
   */
  setDigitizedAt(dt: DateTime): Record<string, string> {
    return Resolver.prepareDateTags('CreateDate', 'SubSecTimeDigitized', 'OffsetTimeDigitized', dt);
  }

  /**
   * Return tag changes for setting the modification date/time.
   * Writes to ModifyDate, SubSecTime, OffsetTime.
   */
  setModifiedAt(dt: DateTime): Record<string, string> {
    return Resolver.prepareDateTags('ModifyDate', 'SubSecTime', 'OffsetTime', dt);
  }

  /**
   * Return tag changes for setting all date/time tags to the same value.
   */
  setAllDates(dt: DateTime): Record<string, string> {
    return {
      ...this.setOriginatedAt(dt),
      ...this.setDigitizedAt(dt),
      ...this.setModifiedAt(dt),
    };
  }

  /**
   * Return tag changes for shifting all creation, digitization, and modification
   * timestamps by a relative duration. Useful for correcting camera clock drift
   * across a batch of photos.
   */
  adjustAllDates(duration: Temporal.DurationLike): Record<string, string> {
    const changes: Record<string, string> = {};
    const originated = this.originatedAt();
    if (originated) Object.assign(changes, this.setOriginatedAt(originated.add(duration)));
    const digitized = this.digitizedAt();
    if (digitized) Object.assign(changes, this.setDigitizedAt(digitized.add(duration)));
    const modified = this.modifiedAt();
    if (modified) Object.assign(changes, this.setModifiedAt(modified.add(duration)));
    return changes;
  }

  /**
   * Return tag changes for re-basing timestamps to a target timezone offset.
   * Adjusts both wall-clock time and timezone offset tags while keeping
   * the exact same UTC instant.
   *
   * Example: Camera was set to NY (17:00 -05:00). Re-basing to SFO (-07:00)
   * updates wall-clock to 14:00 and offset tags to "-07:00".
   */
  shiftTimezone(tz: ISOTZ): Record<string, string> {
    const changes: Record<string, string> = {};
    const originated = this.originatedAt();
    if (originated) Object.assign(changes, this.setOriginatedAt(originated.withTz(tz)));
    const digitized = this.digitizedAt();
    if (digitized) Object.assign(changes, this.setDigitizedAt(digitized.withTz(tz)));
    const modified = this.modifiedAt();
    if (modified) Object.assign(changes, this.setModifiedAt(modified.withTz(tz)));
    return changes;
  }

  /**
   * Return tag changes for an approximate or partial date (scanned photos).
   *
   * Standard EXIF tags receive a padded DateTime (e.g. 1975 -> 1975:01:01 00:00:00),
   * while XMP tags store the exact partial ISO string ("1975" or "1975-06").
   */
  setPartialDate(date: { year: number; month?: number; day?: number }): Record<string, string> {
    const month = date.month ?? 1;
    const day = date.day ?? 1;

    const dt = DateTime.fromComponents(date.year, month, day, 0, 0, 0, 0);
    const changes = this.setAllDates(dt);

    const yStr = String(date.year).padStart(4, '0');
    let partialStr = yStr;
    if (date.month !== undefined) {
      partialStr += `-${String(date.month).padStart(2, '0')}`;
      if (date.day !== undefined) {
        partialStr += `-${String(date.day).padStart(2, '0')}`;
      }
    }
    changes['XMP-dc:Date'] = partialStr;
    changes['XMP-photoshop:DateCreated'] = partialStr;
    return changes;
  }

  /**
   * Return tag changes for setting timezone offset tags without changing
   * wall-clock date/time values.
   */
  setTimezoneOffset(offset: string): Record<string, string> {
    const normalized = Resolver.normalizeOffset(offset);
    return {
      OffsetTimeOriginal: normalized,
      OffsetTimeDigitized: normalized,
      OffsetTime: normalized,
    };
  }
}

const asInt = (val: unknown): Integer | undefined => _.isDefined(val) ? _.asInt(val) : undefined;
