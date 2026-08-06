import { DateTime, type ISOTZ } from '@epdoc/datetime';
import * as Normalize from '../normalize.ts';
import * as Parse from './parse.ts';
import type { Parts } from './types.ts';

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
  const parts = Parse.dateString(base);
  if (!parts) return undefined;

  // Filter out uninitialized video/image metadata sentinels
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
 * Check if parsed date components represent uninitialized metadata sentinels
 * (e.g. year 0, QuickTime 1904 zero epoch, or Unix 1970 zero epoch).
 */
function isUninitializedSentinel(parts: Parts): boolean {
  // Invalid / Zero year
  if (parts.year <= 0) return true;

  // QuickTime uninitialized header baseline (1904-01-01 00:00:00)
  if (
    parts.year === 1904 &&
    parts.month === 1 &&
    parts.day === 1 &&
    parts.hour === 0 &&
    parts.minute === 0 &&
    parts.second === 0
  ) {
    return true;
  }

  // Unix uninitialized header baseline (1970-01-01 00:00:00)
  if (
    parts.year === 1970 &&
    parts.month === 1 &&
    parts.day === 1 &&
    parts.hour === 0 &&
    parts.minute === 0 &&
    parts.second === 0
  ) {
    return true;
  }

  return false;
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
    return dt.withTz('utc').format('yyyy:MM:dd HH:mm:ss');
  }
  return dt.format('yyyy:MM:dd HH:mm:ss');
}
