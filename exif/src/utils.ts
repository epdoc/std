import { _ } from '@epdoc/type';
import type { Metadata } from './exif-schema.ts';

/**
 * Parse the JSON stdout of `exiftool -j` into an array of metadata objects.
 * exiftool emits an array when multiple files are passed and a single object
 * for one file; this normalizes both.
 */
export function parseJson(stdout: string): Metadata[] {
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
export function parseDuration(value: string | number | undefined): number | undefined {
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
export function parseFocalLength(input: unknown): number | undefined {
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
