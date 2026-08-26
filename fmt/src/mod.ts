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
 * char()('check');           // "✓"
 * char()('left');            // "←"
 *
 * // With sub-path imports
 * import { bool } from '@epdoc/fmt/bool';
 * ```
 *
 * @module @epdoc/fmt
 */
import { BoolPreset as BoolPresetValue } from './bool.ts';
import type { BoolPreset as BoolPresetType } from './bool.ts';
export { bool, BOOL_PRESETS } from './bool.ts';
export type { BoolFormatterOptions } from './bool.ts';
export type { BoolPreset as BoolPresetName } from './bool.ts';
/** Runtime mapping of bool preset names to themselves. */
export const BoolPreset = BoolPresetValue;
/** Name of a predefined bool preset. */
export type BoolPreset = BoolPresetType;
export { bytes } from './bytes.ts';
export type { BytesOptions } from './bytes.ts';
export * from './char.ts';
export * from './icons.ts';
export { percent } from './percent.ts';
export type { PercentOptions } from './percent.ts';
export { uptime } from './uptime.ts';
export type { UptimeOptions } from './uptime.ts';
