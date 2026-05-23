/**
 * @epdoc/fmt - Factory functions for formatting common data types for display.
 *
 * Provides color-aware formatter factories for boolean, byte-size, percentage,
 * and duration values. Each factory returns a closure that applies formatting
 * and optional ANSI coloring. Designed for use with table column formatters
 * and message builders.
 *
 * @example
 * ```ts
 * import { bool, bytes, percent, uptime } from '@epdoc/fmt';
 *
 * percent()(0.5);            // "50.00 %"
 * bytes()(1048576);          // "1.0 MiB"
 * uptime()(3661);            // "1h01m01s"
 * bool()(true);              // "✓" (green)
 *
 * // With sub-path imports
 * import { bool } from '@epdoc/fmt/bool';
 * ```
 *
 * @module @epdoc/fmt
 */
export { bool } from './bool.ts';
export type { BoolFormatterOptions, BoolPresetName } from './bool.ts';
export { BOOL_PRESETS } from './bool.ts';
export { percent } from './percent.ts';
export type { PercentOptions } from './percent.ts';
export { bytes } from './bytes.ts';
export type { BytesOptions } from './bytes.ts';
export { uptime } from './uptime.ts';
export type { UptimeOptions } from './uptime.ts';
