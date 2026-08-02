import { DateTime, type ISOTZ } from '@epdoc/datetime';
import type { ExifToolMediaMetadata } from './exif-schema.ts';
import { type ExifDateTimeParts, parseExifDateTime, parseExifMilliseconds } from './utils.ts';

/** A DateTime built from exif date tags, plus the raw milliseconds/timezone it encodes. */
export interface ExifDateTimeResult {
  dateTime: DateTime;
  milliseconds?: number;
  /** ISO 8601 offset (e.g. "+02:00") when the source carried one. */
  tzOffset?: string;
  /** True when the source value included a timezone offset. */
  hasTimezone: boolean;
}

/**
 * Build a {@link DateTime} from parsed exif date components, applying the
 * sub-second and timezone offset the value encoded.
 */
export function dateTimeFromParts(parts: ExifDateTimeParts): DateTime {
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
 * Build a {@link DateTime} from exif date tags.
 *
 * @param base The primary date tag (e.g. `CreateDate`, `DateTimeOriginal`),
 *             in exiftool's `"YYYY:MM:DD HH:MM:SS"` format.
 * @param subSec A separate sub-second tag (e.g. `SubSecTimeOriginal`), used when
 *               the base value carries no fractional second.
 * @param offset A separate timezone-offset tag (e.g. `OffsetTimeOriginal`), used
 *               when the base value carries no timezone.
 * @returns The parsed date/time, or `undefined` when no parseable date is present.
 */
export function buildExifDateTime(
  base: string | undefined,
  subSec?: string | number,
  offset?: string,
): ExifDateTimeResult | undefined {
  const parts = parseExifDateTime(base);
  if (!parts) return undefined;

  let milliseconds = parts.millisecond;
  if (milliseconds === undefined && subSec !== undefined) {
    milliseconds = parseExifMilliseconds(subSec);
  }
  let tzOffset = parts.tzOffset;
  if (!tzOffset && offset) tzOffset = offset;

  return {
    dateTime: dateTimeFromParts({ ...parts, millisecond: milliseconds, tzOffset }),
    milliseconds,
    tzOffset,
    hasTimezone: tzOffset !== undefined,
  };
}

/**
 * Return the creation date/time from an exif metadata object.
 *
 * Priority: DateTimeOriginal (with SubSecDateTimeOriginal) → CreateDate /
 * DateCreated (with SubSecCreateDate).
 */
export function getCreatedDateTime(meta: ExifToolMediaMetadata): ExifDateTimeResult | undefined {
  const original = buildExifDateTime(
    meta.SubSecDateTimeOriginal ?? meta.DateTimeOriginal,
    meta.SubSecTimeOriginal,
    meta.OffsetTimeOriginal,
  );
  if (original) return original;

  return buildExifDateTime(
    meta.SubSecCreateDate ?? meta.CreateDate ?? meta.DateCreated,
    meta.SubSecTimeDigitized,
    meta.OffsetTimeDigitized,
  );
}

/**
 * Return the digitization date/time from an exif metadata object.
 *
 * Uses CreateDate / DateCreated (with SubSecCreateDate when present).
 */
export function getDigitizedDateTime(meta: ExifToolMediaMetadata): ExifDateTimeResult | undefined {
  return buildExifDateTime(
    meta.SubSecCreateDate ?? meta.CreateDate ?? meta.DateCreated,
    meta.SubSecTimeDigitized,
    meta.OffsetTimeDigitized,
  );
}

/**
 * Return the modification date/time from an exif metadata object.
 *
 * Priority: ModifyDate → FileModifyDate → FileInodeChangeDate → FileAccessDate.
 */
export function getModifiedDateTime(meta: ExifToolMediaMetadata): ExifDateTimeResult | undefined {
  const modified = buildExifDateTime(
    meta.SubSecModifyDate ?? meta.ModifyDate,
    meta.SubSecTime,
    meta.OffsetTime,
  );
  if (modified) return modified;

  const fileModified = buildExifDateTime(
    meta.FileModifyDate,
    undefined,
    meta.OffsetTime,
  );
  if (fileModified) return fileModified;

  const fileInodeChanged = buildExifDateTime(
    meta.FileInodeChangeDate,
    undefined,
    meta.OffsetTime,
  );
  if (fileInodeChanged) return fileInodeChanged;

  return buildExifDateTime(
    meta.FileAccessDate,
    undefined,
    meta.OffsetTime,
  );
}

/**
 * Return the "primary" date/time from an exif metadata object, in priority order:
 * original (DateTimeOriginal) → digitized (CreateDate) → modified (ModifyDate).
 */
export function getMetaDateTime(meta: ExifToolMediaMetadata): ExifDateTimeResult | undefined {
  return getCreatedDateTime(meta) ?? getDigitizedDateTime(meta) ?? getModifiedDateTime(meta);
}
