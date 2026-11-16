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

/** Width of the syntax column in the help text. */
const HELP_LABEL_WIDTH = 24;

/** One row of the help reference: a literal syntax and what it means. */
interface HelpRow {
  /** The literal syntax, shown in the left column. */
  label: string;
  /** What it means. */
  text: string;
  /** Sample values, rendered after the text. */
  examples?: string[];
}

/** A titled group of rows in the help reference. */
interface HelpSection {
  title: string;
  rows: HelpRow[];
  /** Caveat lines shown below the rows. */
  notes?: string[];
}

/**
 * Help for options that take a whole range: absolute dates, relative times,
 * `start-end` ranges (including `6h-4h`), open ends, and comma-separated lists.
 */
const RANGE_SECTIONS: HelpSection[] = [
  {
    title: 'Absolute dates (local time zone; a bare date covers the whole period):',
    rows: [
      { label: 'YYYY', text: 'Whole year', examples: ['2024'] },
      { label: 'YYYYMM', text: 'Whole month', examples: ['202401'] },
      { label: 'YYYYMMDD', text: 'Whole day', examples: ['20240115'] },
      { label: 'YYYYMMDDhh', text: 'Exact hour', examples: ['2024011510'] },
      { label: 'YYYYMMDDhhmm', text: 'Exact minute', examples: ['202401151030'] },
      { label: 'YYYYMMDDhhmmss', text: 'Exact second', examples: ['20240115103045'] },
      { label: 'ISO 8601', text: 'Explicit offset', examples: ['2024-01-15T10:30:00Z'] },
    ],
  },
  {
    title: 'Relative to now (a bare duration is in the past, a leading "-" is the future):',
    rows: [
      { label: '30m, 6h, 1d', text: 'That long ago' },
      { label: '2h30m, 1d12h', text: 'Combined units (y, d, h, m, s)' },
      { label: '-1h', text: '1 hour from now' },
      { label: 'now', text: 'This instant' },
      { label: 'today', text: 'Start of today' },
      { label: 'yesterday', text: 'Start of yesterday' },
      { label: 'tomorrow', text: 'Start of tomorrow' },
      { label: 'endofday', text: 'End of today' },
    ],
  },
  {
    title: 'Ranges — "start-end", both sides in any form above:',
    rows: [
      { label: '6h-4h', text: 'From 6 hours ago to 4 hours ago (a 2-hour window)' },
      { label: '7d-now', text: 'The last 7 days' },
      { label: '20240101-now', text: 'Mixed absolute and relative' },
      { label: '20240101-20241231', text: 'Two absolute dates' },
      { label: '20240101-', text: 'Open end: from that date, no upper bound' },
      { label: '-20240131', text: 'Open start: up to that date, no lower bound' },
    ],
    notes: [
      'Both sides of a relative range count back from now, so "6h-4h" ends 4 hours ago.',
      'A leading "-" is an open start, not "future" — write "6h-4h", not "-6h--4h".',
    ],
  },
  {
    title: 'Multiple ranges (comma-separated):',
    rows: [
      { label: '2024,2025', text: 'Two whole periods' },
      { label: '202501-202503,1d-now', text: 'Absolute and relative together' },
    ],
  },
  {
    title: 'Typical flag spellings:',
    rows: [
      { label: '-d 6h-4h', text: 'The 2-hour window from 6h ago to 4h ago' },
      { label: '-d 7d-now', text: 'The last 7 days' },
      { label: '-d 20240101-20241231', text: 'All of 2024' },
      { label: '-d today', text: 'Today only' },
      { label: '-d 2024,2025', text: 'All of 2024 and 2025' },
    ],
    notes: ['Use the flag the command actually offers — --date, --range or --ranges.'],
  },
];

/** Help for options that take a single instant (`--since`, `--until`). */
const INSTANT_SECTIONS: HelpSection[] = [
  {
    title: 'A single point in time (a bare date is the start of that period):',
    rows: [
      { label: 'YYYYMMDD', text: 'Start of that day', examples: ['20240115'] },
      { label: 'YYYYMM, YYYY', text: 'Start of that month or year', examples: ['202401', '2024'] },
      { label: 'YYYYMMDDhh[mm[ss]]', text: 'Exact time', examples: ['202401151030'] },
      { label: 'ISO 8601', text: 'Explicit offset', examples: ['2024-01-15T10:30:00Z'] },
      { label: '30m, 6h, 2h30m', text: 'That long ago' },
      { label: '-1h', text: '1 hour from now (leading "-" is the future)' },
      { label: 'now', text: 'This instant' },
      { label: 'today, yesterday', text: 'Start of that day' },
      { label: 'tomorrow', text: 'Start of tomorrow' },
      { label: 'endofday', text: 'End of today' },
    ],
  },
];

/** Help for options that take a lookback duration (`--window`). */
const WINDOW_SECTIONS: HelpSection[] = [
  {
    title: 'A duration, measured back from now:',
    rows: [
      { label: '30m', text: 'The last 30 minutes' },
      { label: '24h', text: 'The last 24 hours' },
      { label: '7d', text: 'The last 7 days' },
      { label: '1d12h', text: 'Combined units (y, d, h, m, s)' },
    ],
    notes: ['A leading "-" is the future, not the past — write "7d", not "-7d".'],
  },
];

/** Renders a section list as plain text, one row per line. */
function renderPlainHelp(sections: HelpSection[]): string {
  const lines: string[] = [];
  for (const section of sections) {
    lines.push('', section.title);
    for (const row of section.rows) {
      const text = row.examples?.length ? `${row.text} — e.g. ${row.examples.join(', ')}` : row.text;
      lines.push(`  ${row.label.padEnd(HELP_LABEL_WIDTH)}${text}`);
    }
    for (const note of section.notes ?? []) {
      lines.push(`  ${note}`);
    }
  }
  return `${lines.join('\n')}\n`;
}

/** Renders a section list through a colorizing message builder. */
function renderColorHelp<T extends DateHelpBuilder>(msg: T, sections: HelpSection[]): T {
  for (const section of sections) {
    msg.h2(`\n${section.title}\n`);
    for (const row of section.rows) {
      msg.label(`  ${row.label.padEnd(HELP_LABEL_WIDTH)}`).text(row.text);
      if (row.examples?.length) {
        msg.text(' — e.g. ');
        row.examples.forEach((example, index) => {
          if (index > 0) msg.text(', ');
          msg.code(example);
        });
      }
      msg.text('\n');
    }
    for (const note of section.notes ?? []) {
      msg.text(`  ${note}\n`);
    }
  }
  return msg;
}

/** Plain-text help for range options — suitable for an option's `help` field. */
export function dateRangeHelpText(): string {
  return renderPlainHelp(RANGE_SECTIONS);
}

/** Plain-text help for single-instant options (`--since`, `--until`). */
export function instantHelpText(): string {
  return renderPlainHelp(INSTANT_SECTIONS);
}

/** Plain-text help for lookback-duration options (`--window`). */
export function windowHelpText(): string {
  return renderPlainHelp(WINDOW_SECTIONS);
}

/**
 * Appends colorized date range help text to any compatible MsgBuilder.
 *
 * Keeps `@epdoc/daterange` free of a logger dependency — the caller supplies
 * their own builder instance. The content is identical to `dateRangeHelpText()`.
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
  return renderColorHelp(msg, RANGE_SECTIONS);
}

/** Colorized counterpart of `instantHelpText()`. */
export function buildInstantHelp<T extends DateHelpBuilder>(msg: T): T {
  return renderColorHelp(msg, INSTANT_SECTIONS);
}

/** Colorized counterpart of `windowHelpText()`. */
export function buildWindowHelp<T extends DateHelpBuilder>(msg: T): T {
  return renderColorHelp(msg, WINDOW_SECTIONS);
}

const DATE_HELP: string = dateRangeHelpText();
const INSTANT_HELP: string = instantHelpText();
const WINDOW_HELP: string = windowHelpText();

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
  help: INSTANT_HELP,
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
  help: INSTANT_HELP,
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
    const now = DateTime.now();
    const since = parseRelativeTime(val, now);
    if (!since) throw new Error(`Invalid time window: ${val}`);
    if (since.epochMilliseconds > now.epochMilliseconds) {
      throw new Error(
        `Invalid time window '${val}': it starts in the future. A leading '-' is the future — ` +
          `write '${val.trim().replace(/^[-+]/, '')}' for a window that looks back.`,
      );
    }
    return DateRange.from(since, now);
  },
  help: WINDOW_HELP,
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
