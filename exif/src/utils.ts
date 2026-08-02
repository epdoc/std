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
