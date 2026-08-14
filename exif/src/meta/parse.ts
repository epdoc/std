import { _ } from '@epdoc/type';
import type { Metadata } from '../meta-types.ts';
import type { Parts } from './types.ts';

/**
 * Parse the JSON stdout of `exiftool -j` into an array of metadata objects.
 * exiftool emits an array when multiple files are passed and a single object
 * for one file; this normalizes both.
 */
export function json(stdout: string): Metadata[] {
  const trimmed = stdout.trim();
  if (!trimmed) return [];
  const data = JSON.parse(trimmed);
  return _.isArray(data) ? data as Metadata[] : [data] as Metadata[];
}

/**
 * Normalizes a focal length value into a numeric millimeter value.
 * Handles numbers, strings with unit suffixes (e.g., "6.8 mm", "24mm"),
 * and fractional strings (e.g., "50/1").
 *
 * @param input - Raw focal length input from EXIF or user data.
 * @returns Numeric focal length in mm, or undefined if unparseable.
 */
export function focalLength(input: unknown): number | undefined {
  if (typeof input === 'number') {
    return Number.isFinite(input) && input > 0 ? input : undefined;
  }

  if (typeof input !== 'string') return undefined;

  const trimmed = input.trim();
  if (!trimmed) return undefined;

  const match = trimmed.match(/^([\d.]+)\s*(?:mm)?$/i);
  if (match) {
    const val = parseFloat(match[1]);
    return !isNaN(val) && val > 0 ? val : undefined;
  }

  if (trimmed.includes('/')) {
    const [numStr, denStr] = trimmed.split('/');
    const num = parseFloat(numStr);
    const den = parseFloat(denStr);
    if (!isNaN(num) && !isNaN(den) && den !== 0) {
      const val = num / den;
      return val > 0 ? val : undefined;
    }
  }

  return undefined;
}

/**
 * Normalizes an F-number / aperture value to a number.
 * Accepts bare numbers, or strings like `"f/1.9"`, `"1.9"`, `"F1.9"`.
 *
 * @param input - Raw aperture value from EXIF.
 * @returns Numeric aperture, or undefined if unparseable.
 */
export function fNumber(input: unknown): number | undefined {
  if (typeof input === 'number') {
    return Number.isFinite(input) && input > 0 ? input : undefined;
  }

  if (typeof input !== 'string') return undefined;

  const trimmed = input.trim();
  if (!trimmed) return undefined;

  const match = trimmed.match(/^(?:f\/)?\s*([\d.]+)$/i);
  if (match) {
    const val = parseFloat(match[1]);
    return !isNaN(val) && val > 0 ? val : undefined;
  }

  return undefined;
}

/**
 * Normalizes an exposure time string to seconds.
 * Accepts bare numbers, rational strings like `"1/235"`, or decimal seconds
 * like `"0.004"`.
 *
 * @param input - Raw exposure time from EXIF.
 * @returns Numeric exposure time in seconds, or undefined if unparseable.
 */
export function exposureTime(input: unknown): number | undefined {
  if (typeof input === 'number') {
    return Number.isFinite(input) && input >= 0 ? input : undefined;
  }

  if (typeof input !== 'string') return undefined;

  const trimmed = input.trim();
  if (!trimmed) return undefined;

  const rational = trimmed.match(/^([\d.]+)\s*\/\s*([\d.]+)$/);
  if (rational) {
    const num = parseFloat(rational[1]);
    const den = parseFloat(rational[2]);
    if (!isNaN(num) && !isNaN(den) && den !== 0) {
      const val = num / den;
      return val >= 0 ? val : undefined;
    }
    return undefined;
  }

  const val = parseFloat(trimmed);
  return !isNaN(val) && val >= 0 ? val : undefined;
}

/**
 * Normalizes a subject distance value to meters.
 * Accepts numbers (assumed meters), or strings with optional unit suffix
 * (e.g. `"0.28 m"`).
 *
 * @param input - Raw subject distance from EXIF.
 * @returns Numeric distance in meters, or undefined if unparseable.
 */
export function subjectDistance(input: unknown): number | undefined {
  if (typeof input === 'number') {
    return Number.isFinite(input) && input >= 0 ? input : undefined;
  }

  if (typeof input !== 'string') return undefined;

  const trimmed = input.trim();
  if (!trimmed) return undefined;

  const match = trimmed.match(/^([\d.]+)\s*(?:m)?$/i);
  if (match) {
    const val = parseFloat(match[1]);
    return !isNaN(val) && val >= 0 ? val : undefined;
  }

  return undefined;
}

/**
 * Normalizes a file size value to bytes.
 * Accepts numbers (assumed bytes), or human-readable strings with unit
 * suffixes (e.g. `"2.8 MB"`, `"452 kB"`).
 *
 * @param input - Raw file size from EXIF.
 * @returns Numeric size in bytes, or undefined if unparseable.
 */
export function fileSize(input: unknown): number | undefined {
  type Unit = 'B' | 'KB' | 'MB' | 'GB' | 'TB';
  const multipliers: Record<Unit, number> = {
    B: 1,
    KB: 1000,
    MB: 1000 * 1000,
    GB: 1000 * 1000 * 1000,
    TB: 1000 * 1000 * 1000 * 1000,
  };

  if (typeof input === 'number') {
    return Number.isFinite(input) && input >= 0 ? input : undefined;
  }

  if (typeof input !== 'string') return undefined;

  const trimmed = input.trim();
  if (!trimmed) return undefined;

  const match = trimmed.match(/^([\d.]+)\s*(B|KB|MB|GB|TB)$/i);
  if (match) {
    const val = parseFloat(match[1]);
    const unit = match[2].toUpperCase() as Unit;
    if (!isNaN(val)) {
      return val * multipliers[unit];
    }
  }

  const n = Number(trimmed);
  return Number.isNaN(n) || n < 0 ? undefined : n;
}

/**
 * Normalizes an average bitrate value to bits per second.
 * Accepts numbers (assumed bps), or strings with unit suffixes
 * (e.g. `"631 kbps"`, `"43.5 Mbps"`, `"1.2 Gbps"`).
 *
 * @param input - Raw bitrate from EXIF.
 * @returns Numeric bitrate in bps, or undefined if unparseable.
 */
export function bitrate(input: unknown): number | undefined {
  if (typeof input === 'number') {
    return Number.isFinite(input) && input >= 0 ? input : undefined;
  }

  if (typeof input !== 'string') return undefined;

  const trimmed = input.trim();
  if (!trimmed) return undefined;

  const match = trimmed.match(/^([\d.]+)\s*(kbps|Mbps|Gbps)$/i);
  if (match) {
    const val = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    const multipliers: Record<string, number> = { kbps: 1000, mbps: 1000 * 1000, gbps: 1000 * 1000 * 1000 };
    if (!isNaN(val)) return val * multipliers[unit];
  }

  const n = Number(trimmed);
  return Number.isNaN(n) || n < 0 ? undefined : n;
}

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
 * Normalize an exiftool video `Duration` value to a number of seconds.
 * Accepts `"2.00 s"`, `"MM:SS"`, `"H:MM:SS"`, a bare number, or a plain
 * numeric string. Returns `undefined` for missing/unparseable input.
 *
 * @internal Used by {@link File.duration}.
 */
export function duration(value: string | number | undefined): number | undefined {
  if (value === undefined) return undefined;
  if (_.isNumber(value)) return Number.isFinite(value) ? value : undefined;

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
