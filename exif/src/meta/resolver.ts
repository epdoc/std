import { DateTime, type ISOTZ } from '@epdoc/datetime';
import { _, type Integer } from '@epdoc/type';
import type { Metadata } from '../meta-types.ts';
import * as Normalize from '../normalize.ts';
import type { Seconds } from '../types.ts';
import * as Parse from './parse.ts';
import type { FileSource, Parts } from './types.ts';

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

/**
 * True when the parsed date parts resolve to a container "uninitialized"
 * timestamp. MP4/QuickTime files store zero for missing creation times, which
 * maps to the MP4 epoch of 1904-01-01 UTC; Unix-style containers map zero to
 * 1970-01-01 UTC. Because a timezone offset can shift the parsed wall-clock
 * value by up to a day, we accept a small window around each epoch.
 */
function isUninitializedSentinel(parts: Parts): boolean {
  if (parts.year <= 0) return true;

  // MP4 epoch window: 1903-12-30 through 1904-01-02 (± timezone shift)
  if (parts.year === 1903 && parts.month === 12 && parts.day >= 30) return true;
  if (parts.year === 1904 && parts.month === 1 && parts.day <= 2) return true;

  // Unix epoch window: 1969-12-30 through 1970-01-02 (± timezone shift)
  if (parts.year === 1969 && parts.month === 12 && parts.day >= 30) return true;
  if (parts.year === 1970 && parts.month === 1 && parts.day <= 2) return true;

  return false;
}

type ResolverCache = {
  originatedAt?: DateTime;
  digitizedAt?: DateTime;
  modifiedAt?: DateTime;
  duration?: Seconds;
  height?: Integer;
  width?: Integer;
  codec?: string;
  source?: FileSource;
};

/**
 * Class returns media-agnostic values from Metadata. For example, regardless of whether this is
 * a video or image file, it will return the width and height. Or regardless of whether this is a
 * video or audio fie it will return the duration. Or regardless of the file type it will return
 * it's best knowledge of the originateAt date.
 */
export class Resolver {
  /** The raw exiftool metadata being resolved. */
  meta: Metadata;
  #cache: ResolverCache = {};

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
   * `"application"`) from the file's MIMEType. Returns an empty string when the
   * MIMEType is empty or missing.
   */
  get type(): string {
    const [type] = this.meta.MIMEType?.split('/') ?? [];
    return type ?? '';
  }

  /**
   * Return the creation date/time from an EXIF metadata object.
   *
   * Alias/Wrapper for getOriginal with fallback to Digitized or OS File Dates.
   */
  get createdAt(): DateTime | undefined {
    return this.originatedAt ?? this.digitizedAt;
  }

  /**
   * Return the original capture/recording date/time from internal metadata.
   * Checks EXIF, QuickTime Keys/UserData (videos), XMP, IPTC, and GPS.
   */
  get originatedAt(): DateTime | undefined {
    if (!_.isDefined(this.#cache.originatedAt)) {
      const meta = this.meta;
      this.#cache.originatedAt = Resolver.buildDateTime(meta.SubSecDateTimeOriginal) ??
        Resolver.buildDateTime(
          meta.DateTimeOriginal,
          meta.SubSecTimeOriginal,
          meta.OffsetTimeOriginal,
        ) ??
        Resolver.buildDateTime(meta.CreationDate) ??
        Resolver.buildDateTime(meta.DateCreated) ??
        Resolver.buildDateTime(meta.GPSDateTime);
    }
    return this.#cache.originatedAt;
  }

  /**
   * Return the digitization date/time (CreateDate / DigitalCreationDateTime).
   */
  get digitizedAt(): DateTime | undefined {
    if (!_.isDefined(this.#cache.digitizedAt)) {
      const meta = this.meta;
      this.#cache.digitizedAt = Resolver.buildDateTime(meta.SubSecCreateDate) ??
        Resolver.buildDateTime(
          meta.CreateDate,
          meta.SubSecTimeDigitized,
          meta.OffsetTimeDigitized,
        ) ??
        Resolver.buildDateTime(meta.TrackCreateDate) ??
        Resolver.buildDateTime(meta.MediaCreateDate) ??
        Resolver.buildDateTime(meta.DigitalCreationDateTime) ??
        Resolver.buildDateTime(meta.DigitalCreationDate) ??
        this.originatedAt;
    }
    return this.#cache.digitizedAt;
  }

  /**
   * Return the metadata modification date/time.
   */
  get modifiedAt(): DateTime | undefined {
    if (!_.isDefined(this.#cache.modifiedAt)) {
      const meta = this.meta;
      this.#cache.modifiedAt = Resolver.buildDateTime(
        meta.SubSecModifyDate ?? meta.ModifyDate,
        meta.SubSecTime,
        meta.OffsetTime,
      ) ??
        Resolver.buildDateTime(meta.TrackModifyDate) ??
        Resolver.buildDateTime(meta.MediaModifyDate) ??
        Resolver.buildDateTime(meta.MetadataDate);
    }
    return this.#cache.modifiedAt;
  }

  /**
   * Return the "primary" date/time from an EXIF metadata object, in priority order:
   * original (DateTimeOriginal) → digitized (CreateDate) → modified (ModifyDate).
   */
  get primary(): DateTime | undefined {
    return this.createdAt ?? this.modifiedAt;
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
   */
  get tzOffset(): string | undefined {
    return this.createdAt?.getTzString();
  }

  /**
   * Returns the width of the content
   */
  get width(): Integer | undefined {
    if (!_.isDefined(this.#cache.width)) {
      const m = this.meta;
      this.#cache.width = asInt(m.ExifImageWidth) ?? asInt(m.ImageWidth) ?? asInt(m.SourceImageWidth) ?? undefined;
    }
    return this.#cache.width;
  }

  /**
   * Returns the height of the content
   */
  get height(): Integer | undefined {
    if (!_.isDefined(this.#cache.height)) {
      const m = this.meta;
      this.#cache.height = asInt(m.ExifImageHeight) ?? asInt(m.ImageHeight) ?? asInt(m.SourceImageHeight) ?? undefined;
    }
    return this.#cache.height;
  }

  /**
   * Returns the duration of the video or audio file.
   */
  get duration(): number | undefined {
    if (!_.isDefined(this.#cache.duration)) {
      const m = this.meta;
      this.#cache.duration = Parse.duration(m.Duration) ??
        Parse.duration(m.MediaDuration) ??
        Parse.duration(m.AudioDuration) ??
        Parse.duration(m.TrackDuration) ?? undefined;
    }
    return this.#cache.duration;
  }

  /**
   * Return the codec(s) used by the file. For images this is the encoding
   * process; for video/audio this is the video and/or audio codec,
   * semicolon-separated.
   */
  get codec(): string | undefined {
    if (!_.isDefined(this.#cache.codec)) {
      const m = this.meta;
      const codec: string[] = [];
      if (this.type === 'image') {
        if (m.EncodingProcess) codec.push(m.EncodingProcess);
      } else if (this.type === 'video' || this.type === 'audio') {
        const videoCodec = Normalize.videoCodec(m);
        const audioCodec = Normalize.audioCodec(m);
        if (videoCodec) codec.push(videoCodec);
        if (audioCodec) codec.push(audioCodec);
      }
      if (codec.length) this.#cache.codec = codec.join('; ');
    }
    return this.#cache.codec;
  }

  /**
   * Detect the originator of the file from metadata clues.
   *
   * Detection priority:
   * 1. `Comment` matching TikTok's `vid:v...` content-ID pattern → `'tiktok'`
   * 2. TikTok's `Aigc_info` tag present → `'tiktok'`
   * 3. Filename matching WhatsApp's `IMG-/VID-YYYYMMDD-WA####` convention → `'whatsapp'`
   * 4. `Make` or `Model` present → `'camera'`
   * 5. Otherwise → `undefined`
   */
  get source(): FileSource | undefined {
    if (!_.isDefined(this.#cache.source)) {
      const m = this.meta;
      if (m.Comment && /^vid:v\d+/i.test(m.Comment)) {
        this.#cache.source = 'tiktok';
      } else if (m.Aigc_info !== undefined) {
        this.#cache.source = 'tiktok';
      } else if (m.FileName && /^(?:IMG|VID)-\d{8}-WA\d{4,}\./i.test(m.FileName)) {
        this.#cache.source = 'whatsapp';
      } else if (m.Make || m.Model) {
        this.#cache.source = 'camera';
      } else {
        this.#cache.source = undefined;
      }
    }
    return this.#cache.source;
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
   * Return tag changes that repair missing or uninitialized date tags using a
   * fallback date (typically the filesystem timestamp of the file).
   *
   * Only applies when the file's {@link source} is a platform that stripped
   * or corrupted the embedded dates (`'tiktok'` or `'whatsapp'`) AND no
   * reliable embedded date could be resolved. Returns an empty changeset when
   * there is nothing to repair.
   *
   * @param fallbackDate The replacement date/time to write, e.g. the file's
   *                     filesystem modified date. Pass `undefined` when no
   *                     reliable fallback is available.
   */
  repairDates(fallbackDate: DateTime | undefined): Record<string, string> {
    const source = this.source;
    if (source !== 'tiktok' && source !== 'whatsapp') return {};
    if (!fallbackDate) return {};
    if (this.originatedAt || this.digitizedAt || this.modifiedAt) return {};
    return this.setAllDates(fallbackDate);
  }

  /**
   * Return tag changes for shifting all creation, digitization, and modification
   * timestamps by a relative duration. Useful for correcting camera clock drift
   * across a batch of photos.
   */
  adjustAllDates(duration: Temporal.DurationLike): Record<string, string> {
    const changes: Record<string, string> = {};
    const originated = this.originatedAt;
    if (originated) Object.assign(changes, this.setOriginatedAt(originated.add(duration)));
    const digitized = this.digitizedAt;
    if (digitized) Object.assign(changes, this.setDigitizedAt(digitized.add(duration)));
    const modified = this.modifiedAt;
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
    const originated = this.originatedAt;
    if (originated) Object.assign(changes, this.setOriginatedAt(originated.withTz(tz)));
    const digitized = this.digitizedAt;
    if (digitized) Object.assign(changes, this.setDigitizedAt(digitized.withTz(tz)));
    const modified = this.modifiedAt;
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
