import { _ } from '@epdoc/type';
import type { ExifToolMediaMetadata } from './exif-schema.ts';

/**
 * Parse the JSON stdout of `exiftool -j` into an array of metadata objects.
 * exiftool emits an array when multiple files are passed and a single object
 * for one file; this normalizes both.
 */
export function parseExifJson(stdout: string): ExifToolMediaMetadata[] {
  const trimmed = stdout.trim();
  if (!trimmed) return [];
  const data = JSON.parse(trimmed);
  return _.isArray(data) ? data as ExifToolMediaMetadata[] : [data] as ExifToolMediaMetadata[];
}

/**
 * Normalize an exiftool video `Duration` value to a number of seconds.
 * Accepts `"2.00 s"`, `"MM:SS"`, `"H:MM:SS"`, a bare number, or a plain
 * numeric string. Returns `undefined` for missing/unparseable input.
 *
 * @internal Used by {@link File.duration}.
 */
export function parseExifDuration(value: string | number | undefined): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;

  const s = value.trim();
  if (!s) return undefined;

  // "2.00 s"
  const seconds = s.match(/^([\d.]+)\s*s$/i);
  if (seconds) return parseFloat(seconds[1]);

  // "MM:SS" or "H:MM:SS"
  const parts = s.split(':').map((p) => p.trim());
  if (parts.length >= 2 && parts.length <= 3 && parts.every((p) => /^\d+(\.\d+)?$/.test(p))) {
    return parts.reduce((acc, p) => acc * 60 + parseFloat(p), 0);
  }

  const n = Number(s);
  return Number.isNaN(n) ? undefined : n;
}

/**
 * Parse an EXIF sub-second value to milliseconds.
 * Handles exiftool's fractional-second strings of variable length.
 *
 * Note: EXIF fractional seconds are commonly 1-3 digits. Values with more
 * than 3 digits are truncated to millisecond precision.
 */
export function parseExifMilliseconds(raw: string | number | undefined): number | undefined {
  if (raw === undefined || raw === null) return undefined;
  const s = String(raw);
  const frac = s.padEnd(3, '0').slice(0, 3);
  return parseInt(frac, 10);
}

/** Parsed components of an exiftool date/time value. */
export interface ExifDateTimeParts {
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
export function parseExifDateTime(value: string | undefined): ExifDateTimeParts | undefined {
  if (!value) return undefined;
  const m = EXIF_DATE_FULL_RE.exec(value.trim());
  if (!m) return undefined;
  const parts: ExifDateTimeParts = {
    year: parseInt(m[1], 10),
    month: parseInt(m[2], 10),
    day: parseInt(m[3], 10),
    hour: parseInt(m[4], 10),
    minute: parseInt(m[5], 10),
    second: parseInt(m[6], 10),
  };
  if (m[7]) parts.millisecond = parseExifMilliseconds(m[7]);
  if (m[8] === 'Z') parts.tzOffset = '+00:00';
  else if (m[9]) {
    parts.tzOffset = `${m[9]}${m[10]}:${m[11] ?? '00'}`;
  }
  return parts;
}

/**
 * Convert a timezone offset string (e.g. `"-06:00"`, `"+01:00"`) to signed
 * minutes using the intuitive ISO 8601 convention: positive values are ahead
 * of UTC and negative values are behind UTC.
 *
 * To convert the result into a {@link @epdoc/datetime!DateTime} timezone
 * value, pass the original offset string directly to
 * {@link @epdoc/datetime!DateTime.setTz} as an `ISOTZ`.
 */
export function parseExifTzOffset(tz: string): number {
  const sign = tz.startsWith('-') ? -1 : 1;
  const rest = tz.startsWith('-') || tz.startsWith('+') ? tz.slice(1) : tz;
  const parts = rest.split(':');
  return sign * (parseInt(parts[0], 10) * 60 + parseInt(parts[1] ?? '0', 10));
}

/** The fields {@link formatExifDateTime} requires. */
export interface ExifDateTimeInput {
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
export function formatExifDateTime(p: ExifDateTimeInput): string {
  const Y = String(p.year).padStart(4, '0');
  const M = String(p.month).padStart(2, '0');
  const D = String(p.day).padStart(2, '0');
  const h = String(p.hour).padStart(2, '0');
  const min = String(p.minute).padStart(2, '0');
  const s = String(p.second).padStart(2, '0');
  return `${Y}:${M}:${D} ${h}:${min}:${s}`;
}
