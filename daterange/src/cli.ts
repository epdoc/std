/**
 * @module
 *
 * Ready-to-use CLI option definitions for date ranges, compatible with
 * `@epdoc/cliapp`'s `OptionDefMap`.
 *
 * ## Quick start
 *
 * Spread any combination of the pre-built option defs into your `optionDefs`:
 *
 * ```ts
 * import type * as CliApp from '@epdoc/cliapp';
 * import { dateRangeOptionDefs } from '@epdoc/daterange';
 *
 * export const optionDefs: CliApp.OptionDefMap = {
 *   ...dateRangeOptionDefs,   // includes: date, ranges, since, until, window
 *   // your other options…
 * };
 * ```
 *
 * Or pick individual entries:
 *
 * ```ts
 * import { dateOptionDef, sinceOptionDef, untilOptionDef } from '@epdoc/daterange';
 *
 * export const optionDefs: CliApp.OptionDefMap = {
 *   date: dateOptionDef,
 *   since: sinceOptionDef,
 *   until: untilOptionDef,
 * };
 * ```
 *
 * For colorized help text in a `helpText()` method, use `buildDateHelp()`:
 *
 * ```ts
 * import { buildDateHelp } from '@epdoc/daterange';
 *
 * helpText(): string {
 *   const msg = new CustomMsgBuilder();
 *   buildDateHelp(msg);
 *   return msg.format();
 * }
 * ```
 */
import { DateTime } from '@epdoc/datetime';
import { DateRange, DateRanges, dateRanges, dateStringToInstant, parseRelativeTime } from './mod.ts';

/**
 * Minimal interface for the builder methods used by `buildDateHelp`.
 * Compatible with `ConsoleMsgBuilder` and any subclass — no dependency on
 * `@epdoc/logger` required in this package.
 */
export interface DateHelpBuilder {
  h2(...args: unknown[]): this;
  label(...args: unknown[]): this;
  value(...args: unknown[]): this;
  text(...args: unknown[]): this;
  code(...args: unknown[]): this;
}

/**
 * Appends colorized date range help text to any compatible MsgBuilder.
 *
 * Keeps `@epdoc/daterange` free of a logger dependency — the caller supplies
 * their own builder instance.
 *
 * @example
 * ```ts
 * helpText(): string {
 *   const msg = new CustomMsgBuilder();
 *   msg.h1('\nDate Range Formats\n');
 *   buildDateHelp(msg);
 *   return msg.format();
 * }
 * ```
 */
export function buildDateHelp<T extends DateHelpBuilder>(msg: T): T {
  msg.h2('\nAbsolute Dates (local timezone):\n');
  msg.label('  YYYYMMDD          ').text('Single date — e.g. ').code('20240115').text('\n');
  msg.label('  YYYYMM            ').text('Whole month — e.g. ').code('202401').text('\n');
  msg.label('  YYYY              ').text('Whole year — e.g. ').code('2024').text('\n');
  msg.label('  YYYYMMDD-YYYYMMDD ').text('Date range — e.g. ').code('20240101-20241231').text('\n');

  msg.h2('\nRelative Times (from now):\n');
  msg.label('  Ns, Nm, Nh, Nd    ').text('Seconds/minutes/hours/days — e.g. ').code('1d').text(', ').code('2h30m').text(
    '\n',
  );
  msg.label('  now               ').text('Current time\n');
  msg.label('  today             ').text('Start of today\n');
  msg.label('  yesterday         ').text('Start of yesterday\n');
  msg.label('  tomorrow          ').text('Start of tomorrow\n');

  msg.h2('\nMultiple Ranges (comma-separated):\n');
  msg.value('  2024,202501-202503\n');
  msg.value('  1d-now,20240101-20240201\n');

  msg.h2('\nExamples:\n');
  msg.label('  -d ').value('20240101-20241231  ').text('All of 2024\n');
  msg.label('  -d ').value('7d-now             ').text('Last 7 days\n');
  msg.label('  -d ').value('today              ').text('Today only\n');
  msg.label('  -d ').value('2024,2025          ').text('All of 2024 and 2025\n');

  return msg;
}

const DATE_HELP: string = `
ABSOLUTE DATES (local timezone):
  YYYYMMDD          Single date (e.g., 20240115)
  YYYYMM            Whole month (e.g., 202401)
  YYYY              Whole year (e.g., 2024)
  YYYYMMDD-YYYYMMDD Date range (e.g., 20240101-20241231)

RELATIVE TIMES (from now):
  Ns, Nm, Nh, Nd    Seconds, minutes, hours, days (e.g., 1d, 2h30m)
  now               Current time
  today / yesterday / tomorrow

MULTIPLE RANGES (comma-separated):
  2024,202501-202503
  1d-now,20240101-20240201

EXAMPLES:
  -d 20240101-20241231     All of 2024
  -d 7d-now                Last 7 days
  -d today                 Today only
  -d 2024,2025             All of 2024 and 2025
`;

/** Parses any date range expression into a `DateTime`. */
function parseDateTimeArg(val: string): DateTime {
  const result = parseRelativeTime(val) ?? DateTime.tryFrom(val);
  if (result) return result;
  try {
    return dateStringToInstant(val);
  } catch { /* fall through */ }
  throw new Error(`Invalid date/time: ${val}`);
}

/**
 * `-d, --date <date-range>` — parses to `DateRanges`.
 * Accepts any combination of absolute, relative, and comma-separated ranges.
 */
export const dateOptionDef = {
  short: 'd',
  name: 'date',
  params: '<date-range>' as const,
  description: 'Date range(s) (e.g., 20240101-20241231, 7d-now, today).',
  argParser: dateRanges,
  help: DATE_HELP,
};

/**
 * `-r, --range <date-range>` — parses a **single** date range to `DateRange`.
 * Throws if the input resolves to more than one range.
 */
export const rangeOptionDef = {
  short: 'r',
  name: 'range',
  params: '<date-range>' as const,
  description: 'Single date range (e.g., 20240101-20241231, 7d-now).',
  argParser: (val: string): DateRange => {
    const dr = dateRanges(val);
    if (dr.ranges.length !== 1) throw new Error(`Expected a single date range, got ${dr.ranges.length}`);
    return dr.ranges[0] as DateRange;
  },
  help: DATE_HELP,
};

/**
 * `-R, --ranges <date-ranges>` — parses comma-separated ranges to `DateRanges`.
 * Identical to `dateOptionDef` but uses `-R`/`--ranges` flags.
 */
export const rangesOptionDef = {
  short: 'R',
  name: 'ranges',
  params: '<date-ranges>' as const,
  description: 'Comma-separated date ranges (e.g., 2024,202501-202503,1d-now).',
  argParser: dateRanges,
  help: DATE_HELP,
};

/**
 * `-s, --since <date>` — parses a start boundary to `DateTime`.
 * Combine with `untilOptionDef` to build a `DateRange` in your command handler.
 */
export const sinceOptionDef = {
  short: 's',
  name: 'since',
  params: '<date>' as const,
  description: 'Start date/time (e.g., 1d, 20240101, 2024-01-01T00:00:00Z)',
  argParser: parseDateTimeArg,
};

/**
 * `-u, --until <date>` — parses an end boundary to `DateTime`. Defaults to `now`.
 * Combine with `sinceOptionDef` to build a `DateRange` in your command handler.
 */
export const untilOptionDef = {
  short: 'u',
  name: 'until',
  params: '<date>' as const,
  description: 'End date/time (e.g., now, -1h, 20240131). Default: now',
  defVal: 'now',
  argParser: parseDateTimeArg,
};

/**
 * `-w, --window <duration>` — parses a lookback duration to a `DateRange` ending now.
 * Convenience alternative to using `--since` + `--until`.
 *
 * @example `--window 7d` → DateRange from 7 days ago to now
 */
export const windowOptionDef = {
  short: 'w',
  name: 'window',
  params: '<duration>' as const,
  description: 'Lookback window ending now (e.g., 24h, 7d, 30m)',
  argParser: (val: string): DateRange => {
    const since = parseRelativeTime(val);
    if (!since) throw new Error(`Invalid time window: ${val}`);
    return new DateRange(since, DateTime.now());
  },
};

/**
 * Ready-to-use `CliApp.OptionDefMap` fragment with all date range options.
 * Spread into your own `optionDefs` and remove any you don't need.
 */
export const dateRangeOptionDefs = {
  date: dateOptionDef,
  range: rangeOptionDef,
  ranges: rangesOptionDef,
  since: sinceOptionDef,
  until: untilOptionDef,
  window: windowOptionDef,
} as const;

/**
 * Type guard to check if a value is a `DateRanges` instance.
 */
export function isDateRanges(val: unknown): val is DateRanges {
  return val instanceof DateRanges;
}
