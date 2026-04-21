/**
 * @module
 *
 * This module provides CLI option definitions for @epdoc/daterange that can be used
 * with @epdoc/cliapp or any CLI framework supporting similar option definitions.
 *
 * These are plain factory functions returning option definition objects - they don't
 * depend on any specific CLI framework.
 *
 * @example
 * ```ts
 * import { dateRangeOptions } from '@epdoc/daterange/cli';
 * import * as CliApp from '@epdoc/cliapp';
 *
 * class MyCommand extends CliApp.Cmd.AbstractBase {
 *   defineOptions() {
 *     this.option(dateRangeOptions.range()).emit();
 *     this.option(dateRangeOptions.since()).emit();
 *     this.option(dateRangeOptions.until()).emit();
 *   }
 * }
 * ```
 */
import type { LetterChar } from '@epdoc/type';
import { DateTime } from '@epdoc/datetime';
import { DateRange, DateRanges, parseRelativeTime } from './mod.ts';
import { dateStringToInstant } from './util.ts';

export type Params = `[${string}]` | `<${string}>`;

/**
 * Option definition compatible with @epdoc/cliapp and similar frameworks.
 */
export interface DateRangeOptionDef {
  /** Short flag (e.g., "r") */
  short?: LetterChar;
  /** Option name (e.g., "range") */
  name: string;
  /** Parameter syntax (e.g., "<range>") */
  params?: Params;
  /** Description text */
  description: string;
  /** Argument parser function */
  argParser?: (str: string) => unknown;
  /** Default value */
  defVal?: string | number | boolean | string[];
  /** Valid choices */
  choices?: string[];
}

/**
 * Pre-built CLI option definitions for date ranges.
 *
 * These factory functions return option definition objects that can be used
 * with @epdoc/cliapp's `this.option()` method or similar CLI frameworks.
 *
 * @example
 * ```ts
 * // Single date range
 * this.option(dateRangeOptions.range()).emit();
 *
 * // Multiple date ranges
 * this.option(dateRangeOptions.ranges()).emit();
 *
 * // Individual boundaries
 * this.option(dateRangeOptions.since()).emit();
 * this.option(dateRangeOptions.until()).emit();
 *
 * // Custom flags
 * this.option(dateRangeOptions.range('-d, --date <date>')).emit();
 * ```
 */
export const dateRangeOptions = {
  /**
   * Single date range option.
   *
   * Parses a string like "1d-now", "20240101-20240131", "today" into a DateRange.
   *
   * @param flags - Option flags (default: '-d, --date [dates]')
   * @returns Option definition
   *
   * @example
   * ```ts
   * this.option(dateRangeOptions.range()).emit();
   * // User can pass: -d 1d-now, --date 20240101-20240131, --date today
   * ```
   */
  range: (flags = '-d, --date [dates]'): DateRangeOptionDef => {
    const match = flags.match(/^(?:-(\w),\s*)?--([\w-]+)(?:\s+([<\[]\w+[>\]]))?$/);
    if (!match) {
      throw new Error(`Invalid option flags: ${flags}`);
    }

    const [, short, name, params] = match;

    return {
      short: short as LetterChar,
      name,
      params: (params as Params) || '[dates]',
      description: 'Date range (e.g., 1d-now, 20240101-20240131, today)',
      argParser: (val: string) => {
        const ranges = DateRanges.parse(val);
        if (ranges.ranges.length === 0) {
          throw new Error(`Invalid date range: ${val}`);
        }
        if (ranges.ranges.length > 1) {
          throw new Error(`Expected single date range, got ${ranges.ranges.length}. Use ranges() for multiple ranges.`);
        }
        return ranges.ranges[0];
      },
    };
  },

  /**
   * Multiple date ranges option.
   *
   * Parses comma-separated ranges like "2024,202501-202503,1d-now" into DateRanges.
   *
   * @param flags - Option flags (default: '-R, --ranges <ranges>')
   * @returns Option definition
   *
   * @example
   * ```ts
   * this.option(dateRangeOptions.ranges()).emit();
   * // User can pass: -R "2024,202501-202503"
   * ```
   */
  ranges: (flags = '-R, --ranges <ranges>'): DateRangeOptionDef => {
    const match = flags.match(/^(?:-(\w),\s*)?--(\w+)(?:\s+([<\[]\w+[>\]]))?$/);
    if (!match) {
      throw new Error(`Invalid option flags: ${flags}`);
    }

    const [, short, name, params] = match;

    return {
      short: short as LetterChar,
      name,
      params: (params as Params) || '<date-range>',
      description: 'Comma-separated date ranges (e.g., 2024,202501-202503,1d-now)',
      argParser: (val: string) => {
        return DateRanges.parse(val);
      },
    };
  },

  /**
   * Start time (since) option.
   *
   * Parses a relative time or absolute date string into a Temporal.Instant.
   *
   * @param flags - Option flags (default: '-s, --since <since>')
   * @returns Option definition
   *
   * @example
   * ```ts
   * this.option(dateRangeOptions.since()).emit();
   * // User can pass: -s 1d, --since 20240101, --since "2024-01-01T00:00:00Z"
   * ```
   */
  since: (flags = '-s, --since <since>'): DateRangeOptionDef => {
    const match = flags.match(/^(?:-(\w),\s*)?--(\w+)(?:\s+([<\[]\w+[>\]]))?$/);
    if (!match) {
      throw new Error(`Invalid option flags: ${flags}`);
    }

    const [, short, name, params] = match;

    return {
      short: short as LetterChar,
      name,
      params: (params as Params) || '<since>',
      description: 'Start time (e.g., 1d, 2h30m, 20240101, 2024-01-01T00:00:00Z)',
      argParser: (val: string) => {
        // Try relative time first
        const result = parseRelativeTime(val);
        if (result) {
          return result;
        }

        // Try as ISO date
        try {
          return DateTime.tryFrom(val) ?? (() => {
            throw new Error(`Invalid date/time: ${val}`);
          })();
        } catch {
          // Try as compact date (YYYYMMDD, YYYYMM, etc.)
          try {
            return dateStringToInstant(val);
          } catch {
            throw new Error(`Invalid date/time: ${val}`);
          }
        }
      },
    };
  },

  /**
   * End time (until) option.
   *
   * Parses a relative time or absolute date string into a Temporal.Instant.
   * Defaults to 'now' if not specified.
   *
   * @param flags - Option flags (default: '-e, --until <until>')
   * @returns Option definition
   *
   * @example
   * ```ts
   * this.option(dateRangeOptions.until()).emit();
   * // User can pass: -e now, --until 1h (1 hour from now), --until 20240131
   * ```
   */
  until: (flags = '-e, --until <until>'): DateRangeOptionDef => {
    const match = flags.match(/^(?:-(\w),\s*)?--(\w+)(?:\s+([<\[]\w+[>\]]))?$/);
    if (!match) {
      throw new Error(`Invalid option flags: ${flags}`);
    }

    const [, short, name, params] = match;

    return {
      short: short as LetterChar,
      name,
      params: (params as Params) || '<until>',
      description: 'End time (e.g., now, -1h, 20240131). Default: now',
      defVal: 'now',
      argParser: (val: string) => {
        // Try relative time first
        const result = parseRelativeTime(val);
        if (result) {
          return result;
        }

        // Try as ISO date
        try {
          return DateTime.tryFrom(val) ?? (() => {
            throw new Error(`Invalid date/time: ${val}`);
          })();
        } catch {
          // Try as compact date (YYYYMMDD, YYYYMM, etc.)
          try {
            return dateStringToInstant(val);
          } catch {
            throw new Error(`Invalid date/time: ${val}`);
          }
        }
      },
    };
  },

  /**
   * Time window option.
   *
   * Parses a duration string (e.g., "24h", "7d") to specify a lookback window from now.
   * This is a convenience option that sets both since and until implicitly.
   *
   * @param flags - Option flags (default: '-w, --window <window>')
   * @returns Option definition
   *
   * @example
   * ```ts
   * this.option(dateRangeOptions.window()).emit();
   * // User can pass: -w 24h (last 24 hours), --window 7d (last 7 days)
   * ```
   */
  window: (flags = '-w, --window <window>'): DateRangeOptionDef => {
    const match = flags.match(/^(?:-(\w),\s*)?--(\w+)(?:\s+([<\[]\w+[>\]]))?$/);
    if (!match) {
      throw new Error(`Invalid option flags: ${flags}`);
    }

    const [, short, name, params] = match;

    return {
      short: short as LetterChar,
      name,
      params: (params as Params) || '<window>',
      description: 'Time window from now (e.g., 24h, 7d, 30m)',
      argParser: (val: string) => {
        const since = parseRelativeTime(val);
        if (!since) {
          throw new Error(`Invalid time window: ${val}`);
        }
        const until = DateTime.now();
        return new DateRange(since, until);
      },
    };
  },
};

/**
 * Type guard to check if a value is a DateRangeOptionDef.
 */
export function isDateRangeOptionDef(val: unknown): val is DateRangeOptionDef {
  if (typeof val !== 'object' || val === null) {
    return false;
  }
  const obj = val as Record<string, unknown>;
  return typeof obj.name === 'string' && typeof obj.description === 'string';
}
