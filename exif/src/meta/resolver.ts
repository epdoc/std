import { DateTime, type ISOTZ } from '@epdoc/datetime';
import { _, type Integer } from '@epdoc/type';
import { CODEC_MAP, REPAIRABLE } from '../consts.ts';
import { dateFromFilename, isWhatsAppFilename } from '../filename.ts';
import type { AddressDisplayDef } from '../geo/types.ts';
import type { Metadata } from '../meta-types.ts';
import * as Normalize from '../normalize.ts';
import type { MetadataKey, MetadataValue, MetaTagDict, Seconds } from '../types.ts';
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
  producer?: string;
};

/**
 * Class returns media-agnostic values from Metadata. For example, regardless of whether this is
 * a video or image file, it will return the width and height. Or regardless of whether this is a
 * video or audio file it will return the duration. Or regardless of the file type it will return
 * its best knowledge of the originateAt date.
 */
export class Resolver {
  /** The raw exiftool metadata being resolved. */
  meta: Metadata;
  #cache: ResolverCache = {};
  #normalizedMetaMap = new Map<string, MetadataValue>();

  constructor(meta: Metadata) {
    this.meta = meta;
    this.#buildNormalizedMetaMap();
  }

  static from(meta: Metadata): Resolver {
    return new Resolver(meta);
  }

  /**
   * Pre-indexes metadata into a normalized Map once.
   * Strips group prefixes (e.g., 'XMP-photoshop:City' -> 'city') so lookups are O(1).
   */
  #buildNormalizedMetaMap(): void {
    this.#normalizedMetaMap.clear();

    for (const [dataKey, val] of Object.entries(this.meta)) {
      if (val === undefined || val === null || val === '') continue;

      let parsedVal: string | undefined;

      if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed) parsedVal = trimmed;
      } else if (typeof val === 'number') {
        parsedVal = String(val);
      } else if (Array.isArray(val) && val.length > 0) {
        const first = String(val[0]).trim();
        if (first) parsedVal = first;
      }

      if (!parsedVal) continue;

      // 1. Store full normalized key (e.g., 'xmp-photoshop:city')
      const fullKey = dataKey.toLowerCase();
      if (!this.#normalizedMetaMap.has(fullKey)) {
        this.#normalizedMetaMap.set(fullKey, parsedVal);
      }

      // 2. Store base tag without group prefix (e.g., 'city')
      if (dataKey.includes(':')) {
        const tagOnly = dataKey.split(':').pop()!.toLowerCase();
        if (!this.#normalizedMetaMap.has(tagOnly)) {
          this.#normalizedMetaMap.set(tagOnly, parsedVal);
        }
      }
    }
  }

  /**
   * O(1) lookup across candidate keys in priority order.
   * Supports both exact key matches and group-qualified keys (e.g., 'IPTC:City' or 'City').
   */
  getTagValue(...candidateKeys: string[]): MetadataValue | undefined {
    for (const key of candidateKeys) {
      const match = this.#normalizedMetaMap.get(key.toLowerCase());
      if (match) return match;
    }
    return undefined;
  }

  /**
   * Parses raw ExifTool output and reconstructs an AddressComponents object.
   */
  getAddressDef(): AddressDisplayDef | undefined {
    // 1. Country & Country Code
    const country = this.getTagValue(
      'Country',
      'Country-PrimaryLocationName',
      'LocationCreatedCountryName',
      'XMP-photoshop:Country',
      'IPTC:Country-PrimaryLocationName',
    ) ?? '';
    // Country is a required field, I have decreed
    if (!_.isString(country)) return undefined;

    const cc = this.getTagValue(
      'CountryCode',
      'Country-PrimaryLocationCode',
      'LocationCreatedCountryCode',
      'XMP-iptcCore:CountryCode',
      'IPTC:Country-PrimaryLocationCode',
    ) ?? '';
    const countryCode = String(cc).toUpperCase();

    // 2. State / Region
    const state = this.getTagValue(
      'State',
      'Province-State',
      'LocationCreatedProvinceState',
      'XMP-photoshop:State',
      'IPTC:Province-State',
    ) as string;

    // 3. City
    const city = this.getTagValue('City', 'LocationCreatedCity', 'XMP-photoshop:City', 'IPTC:City') as string;

    // 4. Detailed IPTC Extension fields (if present in granular XMP-iptcExt metadata)
    const streetAddress = this.getTagValue('LocationCreatedStreetAddress') as string;
    const location = this.getTagValue(
      'Location',
      'Sub-location',
      'LocationCreatedSublocation',
      'XMP-iptcCore:Location',
      'IPTC:Sub-location',
    ) as string;
    const postalCode = this.getTagValue('XMP-iptcCore:PostalCode') as string;

    // 5. Parse Sub-location string into street / neighborhood if granular fields are missing
    let road = _.isString(streetAddress) ? streetAddress : undefined;
    let neighbourhood: string | undefined;

    if (!road && _.isString(location)) {
      // If Sub-location was constructed as "houseNumber road, neighbourhood", parse comma parts
      const parts = location.split(',').map((p) => p.trim());
      if (parts.length > 1) {
        road = parts[0];
        neighbourhood = parts.slice(1).join(', ');
      } else {
        road = location;
      }
    }

    const displayName = [road, neighbourhood, city, state, country, countryCode].join(', ');

    return {
      country,
      countryCode,
      state,
      city,
      location,
      postalCode,
      streetAddress,
      displayName,
    };
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
    base: MetadataValue | undefined,
    subSec?: MetadataValue,
    offset?: MetadataValue,
  ): DateTime | undefined {
    const baseStr = base !== undefined ? String(base) : undefined;
    const parts = Parse.dateString(baseStr);
    if (!parts) return undefined;

    if (isUninitializedSentinel(parts)) return undefined;

    let milliseconds = parts.millisecond;
    if (milliseconds === undefined && subSec !== undefined) {
      milliseconds = Parse.milliseconds(subSec as string | number);
    }
    let tzOffset = parts.tzOffset;
    if (!tzOffset && offset !== undefined) {
      tzOffset = Normalize.tzOffset(String(offset));
    }

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
    dateTag: MetadataKey,
    subSecTag: MetadataKey,
    offsetTag: MetadataKey,
    dt: DateTime,
  ): MetaTagDict {
    const changes: MetaTagDict = {};
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
    const mime = String(this.getTagValue('MIMEType') ?? '');
    const [type, subtype] = mime.split('/');
    if (type === 'application') return subtype;
    return type ?? 'unknown';
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
      this.#cache.originatedAt = Resolver.buildDateTime(this.getTagValue('SubSecDateTimeOriginal') as string) ??
        Resolver.buildDateTime(
          this.getTagValue('DateTimeOriginal') as string,
          this.getTagValue('SubSecTimeOriginal') as string,
          this.getTagValue('OffsetTimeOriginal') as string,
        ) ??
        Resolver.buildDateTime(this.getTagValue('CreationDate') as string) ??
        Resolver.buildDateTime(this.getTagValue('DateCreated') as string) ??
        Resolver.buildDateTime(this.getTagValue('GPSDateTime') as string);
    }
    return this.#cache.originatedAt;
  }

  /**
   * Return the digitization date/time (CreateDate / DigitalCreationDateTime).
   */
  get digitizedAt(): DateTime | undefined {
    if (!_.isDefined(this.#cache.digitizedAt)) {
      this.#cache.digitizedAt = Resolver.buildDateTime(this.getTagValue('SubSecCreateDate') as string) ??
        Resolver.buildDateTime(
          this.getTagValue('CreateDate') as string,
          this.getTagValue('SubSecTimeDigitized') as string,
          this.getTagValue('OffsetTimeDigitized') as string,
        ) ??
        Resolver.buildDateTime(this.getTagValue('TrackCreateDate') as string) ??
        Resolver.buildDateTime(this.getTagValue('MediaCreateDate') as string) ??
        Resolver.buildDateTime(this.getTagValue('DigitalCreationDateTime') as string) ??
        Resolver.buildDateTime(this.getTagValue('DigitalCreationDate') as string) ??
        this.originatedAt;
    }
    return this.#cache.digitizedAt;
  }

  /**
   * Return the metadata modification date/time.
   */
  get modifiedAt(): DateTime | undefined {
    if (!_.isDefined(this.#cache.modifiedAt)) {
      this.#cache.modifiedAt = Resolver.buildDateTime(
        (this.getTagValue('SubSecModifyDate') ?? this.getTagValue('ModifyDate')) as string,
        this.getTagValue('SubSecTime') as string,
        this.getTagValue('OffsetTime') as string,
      ) ??
        Resolver.buildDateTime(this.getTagValue('TrackModifyDate') as string) ??
        Resolver.buildDateTime(this.getTagValue('MediaModifyDate') as string) ??
        Resolver.buildDateTime(this.getTagValue('MetadataDate') as string);
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
      const val = this.getTagValue('ExifImageWidth', 'ImageWidth', 'SourceImageWidth');
      this.#cache.width = asInt(val);
    }
    return this.#cache.width;
  }

  /**
   * Returns the height of the content
   */
  get height(): Integer | undefined {
    if (!_.isDefined(this.#cache.height)) {
      const val = this.getTagValue('ExifImageHeight', 'ImageHeight', 'SourceImageHeight');
      this.#cache.height = asInt(val);
    }
    return this.#cache.height;
  }

  /**
   * Returns the duration of the video or audio file.
   */
  get duration(): number | undefined {
    if (!_.isDefined(this.#cache.duration)) {
      const val = this.getTagValue('Duration', 'MediaDuration', 'AudioDuration', 'TrackDuration');
      this.#cache.duration = Parse.duration(val);
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
      const codec: string[] = [];
      if (this.type === 'image') {
        const encodingProcess = String(this.getTagValue('EncodingProcess') ?? '');
        if (encodingProcess) {
          codec.push(CODEC_MAP[encodingProcess] ?? encodingProcess);
        }
      } else if (this.type === 'video' || this.type === 'audio') {
        const videoCodec = Normalize.videoCodec(this.meta);
        const audioCodec = Normalize.audioCodec(this.meta);
        if (videoCodec) codec.push(videoCodec);
        if (audioCodec) codec.push(audioCodec);
      }
      if (codec.length) this.#cache.codec = codec.join('; ');
    }
    return this.#cache.codec;
  }

  /**
   * Detect the producer of the file — the app or device at the top of the
   * chain that created the content, i.e. the "highest level" producer.
   */
  get producer(): string | undefined {
    if (!_.isDefined(this.#cache.producer)) {
      const mimeType = String(this.getTagValue('MIMEType') ?? '');
      const fileName = String(this.getTagValue('FileName') ?? '');
      const make = this.getTagValue('Make');
      const model = this.getTagValue('Model');
      const comAndroidManufacturer = this.getTagValue('ComAndroidManufacturer');
      const comAndroidModel = this.getTagValue('ComAndroidModel');
      const comment = String(this.getTagValue('Comment') ?? '');

      if (mimeType === 'application/pdf') {
        const pdfProducer = this.getTagValue('Producer');
        if (pdfProducer) this.#cache.producer = String(pdfProducer);
      } else if (this.type === 'image' || this.type === 'video' || this.type === 'audio') {
        if (make || model || comAndroidManufacturer || comAndroidModel) {
          const cameraName = Normalize.cameraName(this.meta);
          this.#cache.producer = cameraName ?? 'camera';
        } else if (Normalize.isAppleIphone(this.meta)) {
          this.#cache.producer = 'Apple iPhone';
        } else if (comment && /^vid:v\d+/i.test(comment)) {
          this.#cache.producer = 'TikTok';
        } else if (this.getTagValue('Aigc_info') !== undefined) {
          this.#cache.producer = 'TikTok';
        } else if (isWhatsAppFilename(fileName)) {
          this.#cache.producer = 'WhatsApp';
        } else if (Normalize.isFacebook(this.meta)) {
          this.#cache.producer = 'Facebook';
        } else if (Normalize.isSaveForWeb(this.meta)) {
          this.#cache.producer = 'Save for Web';
        } else if (Normalize.isGdJpeg(this.meta)) {
          this.#cache.producer = 'PHP GD';
        } else if (/pagespeed/i.test(fileName)) {
          this.#cache.producer = 'Google PageSpeed';
        } else if (/^PXL_\d{8}_/i.test(fileName)) {
          this.#cache.producer = 'Google Pixel';
        } else if (/^P\d{7}\.jpg$/i.test(fileName)) {
          this.#cache.producer = 'Panasonic Lumix';
        } else if (/^Image uploaded from iOS\.jpg$/i.test(fileName)) {
          this.#cache.producer = 'iOS';
        } else {
          this.#cache.producer = undefined;
        }
      }
    }
    return this.#cache.producer;
  }
  // ==========================================================================
  // Write-prepare methods (return changeset to apply via File.applyTags)
  // ==========================================================================

  /**
   * Return tag changes for setting the original capture date/time.
   * Writes to DateTimeOriginal, SubSecTimeOriginal, OffsetTimeOriginal.
   */
  setOriginatedAt(dt: DateTime): MetaTagDict {
    return Resolver.prepareDateTags('DateTimeOriginal', 'SubSecTimeOriginal', 'OffsetTimeOriginal', dt);
  }

  /**
   * Return tag changes for setting the digitization date/time.
   * Writes to CreateDate, SubSecTimeDigitized, OffsetTimeDigitized.
   */
  setDigitizedAt(dt: DateTime): MetaTagDict {
    return Resolver.prepareDateTags('CreateDate', 'SubSecTimeDigitized', 'OffsetTimeDigitized', dt);
  }

  /**
   * Return tag changes for setting the modification date/time.
   * Writes to ModifyDate, SubSecTime, OffsetTime.
   */
  setModifiedAt(dt: DateTime): MetaTagDict {
    return Resolver.prepareDateTags('ModifyDate', 'SubSecTime', 'OffsetTime', dt);
  }

  /**
   * Return tag changes for setting all date/time tags to the same value.
   */
  setAllDates(dt: DateTime): MetaTagDict {
    return {
      ...this.setOriginatedAt(dt),
      ...this.setDigitizedAt(dt),
      ...this.setModifiedAt(dt),
    };
  }

  /**
   * Return tag changes that repair missing or uninitialized date tags for
   * files whose source platform stripped or corrupted the embedded dates
   * (`'tiktok'` or `'whatsapp'`).
   */
  repairDates(fallbackDate: DateTime | undefined): MetaTagDict {
    const producer = this.producer;
    if (!producer || !REPAIRABLE.includes(producer)) return {};
    if (!fallbackDate) return {};

    if (producer === 'WhatsApp') {
      if (this.originatedAt || this.digitizedAt || this.modifiedAt) return {};
      const fileName = String(this.getTagValue('FileName') ?? '');
      const originalDate = dateFromFilename(fileName)?.withTz('local') ?? fallbackDate;
      return {
        ...this.setOriginatedAt(originalDate),
        ...this.setDigitizedAt(fallbackDate),
        ...this.setModifiedAt(fallbackDate),
      };
    }

    if (this.digitizedAt || this.modifiedAt) return {};
    const dt = Resolver.toExifDateTimeString(fallbackDate);
    return {
      ...this.setDigitizedAt(fallbackDate),
      ...this.setModifiedAt(fallbackDate),
      TrackCreateDate: dt,
      MediaCreateDate: dt,
      TrackModifyDate: dt,
      MediaModifyDate: dt,
    };
  }

  /**
   * Return tag changes for shifting all creation, digitization, and modification
   * timestamps by a relative duration.
   */
  adjustAllDates(duration: Temporal.DurationLike): MetaTagDict {
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
   */
  shiftTimezone(tz: ISOTZ): MetaTagDict {
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
   */
  setPartialDate(date: { year: number; month?: number; day?: number }): MetaTagDict {
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
  setTimezoneOffset(offset: string): MetaTagDict {
    const normalized = Resolver.normalizeOffset(offset);
    return {
      OffsetTimeOriginal: normalized,
      OffsetTimeDigitized: normalized,
      OffsetTime: normalized,
    };
  }
}

const asInt = (val: unknown): Integer | undefined => _.isDefined(val) ? _.asInt(val) : undefined;
