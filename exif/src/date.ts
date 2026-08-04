import { DateTime, type ISOTZ } from '@epdoc/datetime';
import type { Metadata } from './exif-schema.ts';

/**
 * Build a {@link DateTime} from parsed EXIF date components, applying any
 * sub-second and timezone offset the value encoded.
 */
export function fromParts(parts: Parts): DateTime {
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
 * Build a {@link DateTime} from EXIF date tags.
 *
 * @param base The primary date tag (e.g. `CreateDate`, `DateTimeOriginal`),
 *             in exiftool's `"YYYY:MM:DD HH:MM:SS"` format.
 * @param subSec A separate sub-second tag (e.g. `SubSecTimeOriginal`), used when
 *               the base value carries no fractional second.
 * @param offset A separate timezone-offset tag (e.g. `OffsetTimeOriginal`), used
 *               when the base value carries no timezone.
 * @returns The parsed date/time, or `undefined` when no parseable date is present.
 */
export function build(
  base: string | undefined,
  subSec?: string | number,
  offset?: string,
): DateTime | undefined {
  const parts = parse(base);
  if (!parts) return undefined;
  if (parts.year < 1970) return undefined;

  let milliseconds = parts.millisecond;
  if (milliseconds === undefined && subSec !== undefined) {
    milliseconds = parseMilliseconds(subSec);
  }
  let tzOffset = parts.tzOffset;
  if (!tzOffset && offset) tzOffset = offset;

  return fromParts({ ...parts, millisecond: milliseconds, tzOffset });
}

/**
 * Return the creation date/time from an EXIF metadata object.
 *
 * Priority: DateTimeOriginal (with SubSecDateTimeOriginal) → CreateDate /
 * DateCreated (with SubSecCreateDate).
 */
export function getCreated(meta: Metadata): DateTime | undefined {
  const original = build(
    meta.SubSecDateTimeOriginal ?? meta.DateTimeOriginal,
    meta.SubSecTimeOriginal,
    meta.OffsetTimeOriginal,
  );
  if (original) return original;

  const digitized = build(
    meta.SubSecCreateDate ?? meta.CreateDate ?? meta.DateCreated,
    meta.SubSecTimeDigitized,
    meta.OffsetTimeDigitized,
  );
  if (digitized) return digitized;

  return build(meta.FileModifyDate);
}

/**
 * Return the digitization date/time from an EXIF metadata object.
 *
 * Uses CreateDate / DateCreated (with SubSecCreateDate when present).
 */
export function getDigitized(meta: Metadata): DateTime | undefined {
  return build(
    meta.SubSecCreateDate ?? meta.CreateDate ?? meta.DateCreated,
    meta.SubSecTimeDigitized,
    meta.OffsetTimeDigitized,
  ) ?? build(meta.FileModifyDate);
}

/**
 * Return the modification date/time from an EXIF metadata object.
 *
 * Priority: ModifyDate → FileModifyDate → FileInodeChangeDate → FileAccessDate.
 */
export function getModified(meta: Metadata): DateTime | undefined {
  const modified = build(
    meta.SubSecModifyDate ?? meta.ModifyDate,
    meta.SubSecTime,
    meta.OffsetTime,
  );
  if (modified) return modified;

  const fileModified = build(
    meta.FileModifyDate,
    undefined,
    meta.OffsetTime,
  );
  if (fileModified) return fileModified;

  const fileInodeChanged = build(
    meta.FileInodeChangeDate,
    undefined,
    meta.OffsetTime,
  );
  if (fileInodeChanged) return fileInodeChanged;

  return build(
    meta.FileAccessDate,
    undefined,
    meta.OffsetTime,
  );
}

/**
 * Return the "primary" date/time from an EXIF metadata object, in priority order:
 * original (DateTimeOriginal) → digitized (CreateDate) → modified (ModifyDate).
 */
export function getPrimary(meta: Metadata): DateTime | undefined {
  return getCreated(meta) ?? getDigitized(meta) ?? getModified(meta);
}

/** Parsed components of an exiftool date/time value. */
export interface Parts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond?: number;
  /** e.g. "+02:00" (omitted when the value carries no timezone). */
  tzOffset?: string;
}

const EXIF_DATE_FULL_RE =
  /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(?:(Z)|([+-])(\d{2}):?(\d{2}))?$/;

/**
 * Parse an exiftool date string — `"YYYY:MM:DD HH:MM:SS"`, optionally with a
 * fractional second and a `Z` or `±HH:MM` timezone — into its components.
 *
 * Returns `undefined` when the input is missing or unparseable.
 */
export function parse(value: string | undefined): Parts | undefined {
  if (!value) return undefined;
  const m = EXIF_DATE_FULL_RE.exec(value.trim());
  if (!m) return undefined;
  const parts: Parts = {
    year: parseInt(m[1], 10),
    month: parseInt(m[2], 10),
    day: parseInt(m[3], 10),
    hour: parseInt(m[4], 10),
    minute: parseInt(m[5], 10),
    second: parseInt(m[6], 10),
  };
  if (m[7]) parts.millisecond = parseMilliseconds(m[7]);
  if (m[8] === 'Z') parts.tzOffset = '+00:00';
  else if (m[9]) {
    parts.tzOffset = `${m[9]}${m[10]}:${m[11] ?? '00'}`;
  }
  return parts;
}

/**
 * Parse an EXIF sub-second value to milliseconds.
 * Handles exiftool's fractional-second strings of variable length.
 *
 * Note: EXIF fractional seconds are commonly 1-3 digits. Values with more
 * than 3 digits are truncated to millisecond precision.
 */
export function parseMilliseconds(raw: string | number | undefined): number | undefined {
  if (raw === undefined || raw === null) return undefined;
  const s = String(raw);
  const frac = s.padEnd(3, '0').slice(0, 3);
  return parseInt(frac, 10);
}

/**
 * Convert a timezone offset string (e.g. `"-06:00"`, `"+01:00"`) to signed
 * minutes using the intuitive ISO 8601 convention: positive values are ahead
 * of UTC and negative values are behind UTC.
 *
 * To convert the result into a {@link @epdoc/datetime!DateTime} timezone
 * value, pass the original offset string directly to
 * {@link @epdoc/datetime!DateTime.setTz} as an `ISOTZ`.
 *
 * @throws Error if the offset cannot be parsed.
 */
export function parseTzOffset(tz: string): number {
  const sign = tz.startsWith('-') ? -1 : 1;
  const rest = tz.startsWith('-') || tz.startsWith('+') ? tz.slice(1) : tz;
  const parts = rest.split(':');
  return sign * (parseInt(parts[0], 10) * 60 + parseInt(parts[1] ?? '0', 10));
}

/** The fields {@link format} requires. */
export interface Input {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

/**
 * Format date components into exiftool's canonical `"YYYY:MM:DD HH:MM:SS"` form
 * (the format exiftool expects when writing date tags).
 */
export function format(p: Input): string {
  const Y = String(p.year).padStart(4, '0');
  const M = String(p.month).padStart(2, '0');
  const D = String(p.day).padStart(2, '0');
  const h = String(p.hour).padStart(2, '0');
  const min = String(p.minute).padStart(2, '0');
  const s = String(p.second).padStart(2, '0');
  return `${Y}:${M}:${D} ${h}:${min}:${s}`;
}

/**
 * Format a {@link DateTime} as exiftool's canonical `YYYY:MM:DD HH:MM:SS` string.
 *
 * - ZonedDateTime uses the wall-clock time in its timezone.
 * - PlainDateTime uses its wall-clock time.
 * - Instant is interpreted as UTC.
 */
export function formatDateTime(dt: DateTime): string {
  if (dt.temporal instanceof Temporal.Instant) {
    return dt.formatUTC('yyyy:MM:dd HH:mm:ss');
  }
  return dt.format('yyyy:MM:dd HH:mm:ss');
}
