import { _ } from '@epdoc/type';
import type { Metadata } from './metadata.ts';

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

  // Handle standard numeric or decimal string with optional "mm" suffix
  // Matches: "6.8 mm", "24mm", "50", "6.8"
  const match = trimmed.match(/^([\d.]+)\s*(?:mm)?$/i);
  if (match) {
    const val = parseFloat(match[1]);
    return !isNaN(val) && val > 0 ? val : undefined;
  }

  // Handle rational/fractional EXIF strings like "50/1" or "27/5"
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
