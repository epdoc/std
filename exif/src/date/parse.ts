import { _ } from '@epdoc/type';
import type { Parts } from './types.ts';

/**
 * Parse an EXIF sub-second value to milliseconds.
 * Handles exiftool's fractional-second strings of variable length.
 *
 * Note: EXIF fractional seconds are commonly 1-3 digits. Values with more
 * than 3 digits are truncated to millisecond precision.
 */
export function milliseconds(raw: string | number | undefined): number | undefined {
  if (_.isNullOrUndefined(raw)) return undefined;
  const s = String(raw).trim();
  if (!s) return undefined;

  const fraction = parseFloat(`0.${s}`);
  if (isNaN(fraction)) return undefined;

  return Math.round(fraction * 1000);
}

const EXIF_DATE_FULL_RE =
  /^(\d{4})[:-](\d{2})[:-](\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(?:(Z)|([+-])(\d{2}):?(\d{2}))?$/;

/**
 * Parse an exiftool date string — `"YYYY:MM:DD HH:MM:SS"`, optionally with a
 * fractional second and a `Z` or `±HH:MM` timezone — into its components.
 *
 * Returns `undefined` when the input is missing or unparseable.
 */
export function dateString(value: string | undefined): Parts | undefined {
  if (!value) return undefined;
  const m = EXIF_DATE_FULL_RE.exec(value.trim());
  if (!m) return undefined;

  const month = parseInt(m[2], 10);
  const day = parseInt(m[3], 10);

  // Reject invalid zero-months or zero-days (e.g. "2024:00:00 00:00:00")
  if (month === 0 || day === 0) return undefined;

  const parts: Parts = {
    year: parseInt(m[1], 10),
    month,
    day,
    hour: parseInt(m[4], 10),
    minute: parseInt(m[5], 10),
    second: parseInt(m[6], 10),
  };
  if (m[7]) parts.millisecond = milliseconds(m[7]);
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
 *
 * @throws Error if the offset cannot be parsed.
 */
/*
export function tzOffset(tz: string): number {
  const normalized = Normalize.tzOffset(tz);
  const sign = normalized.startsWith('-') ? -1 : 1;
  const rest = normalized.startsWith('-') || normalized.startsWith('+') ? normalized.slice(1) : normalized;
  const parts = rest.split(':');
  return sign * (parseInt(parts[0], 10) * 60 + parseInt(parts[1] ?? '0', 10));
}
*/
