import { _ } from '@epdoc/type';
import { DateTime } from './date.ts';
import type {
  DateParseOptions,
  GMTTZ,
  GoogleSheetsDate,
  IANATZ,
  ISODate,
  ISODateInstant,
  ISODateOffset,
  ISODateZoned,
  ISOTZ,
  PDFTZ,
  TzMinutes,
} from './types.ts';

const REG = {
  isoDate: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|([+-]\d{2}:\d{2}))?$/,
  isoDateInstant: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/,
  isoDateOffset: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?[+-]\d{2}:\d{2}$/,
  isoDateZoned: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})\[[^\]]+\]$/,
  isoTz: /^(Z|((\+|\-)(\d\d):(\d\d)))$/,
  gmtTz: /GMT([+-])(\d{1,2}):?(\d{2})?/,
  pdfTz: /Z|((\+|\-)(\d\d)(\d\d)?)$/,
  ianaTz: /^[A-Za-z_]+\/[A-Za-z_]+$/,
};

/**
 * Checks if a value is a valid ISO 8601 date string.
 * Valid formats include: "2024-03-15T10:30:00Z", "2024-03-15T10:30:00+05:00", "2024-03-15T10:30:00.123Z"
 * @param s - The value to check
 * @returns True if the value is a valid ISO date string
 */
export function isISODate(s: unknown): s is ISODate {
  return _.isString(s) && REG.isoDate.test(s);
}

/**
 * Checks if a value is a valid ISO 8601 instant string (UTC with 'Z' suffix).
 * Valid formats include: "2024-03-15T10:30:00Z", "2024-03-15T10:30:00.123Z"
 * This matches Temporal.Instant.toString() output.
 * @param s - The value to check
 * @returns True if the value is a valid ISO instant string
 */
export function isISODateInstant(s: unknown): s is ISODateInstant {
  return _.isString(s) && REG.isoDateInstant.test(s);
}

/**
 * Checks if a value is a valid ISO 8601 date-time with offset (no timezone name).
 * Valid formats include: "2024-03-15T10:30:00+05:00", "2024-03-15T10:30:00.123-06:00"
 * This represents a date-time with a numeric offset but no IANA timezone location.
 * @param s - The value to check
 * @returns True if the value is a valid ISO date-time with offset
 */
export function isISODateOffset(s: unknown): s is ISODateOffset {
  return _.isString(s) && REG.isoDateOffset.test(s);
}

/**
 * Checks if a value is a valid ISO 8601 zoned date-time string.
 * Valid formats include: "2024-03-15T10:30:00+05:00[Asia/Kolkata]", "2024-03-15T10:30:00Z[Europe/London]"
 * This matches Temporal.ZonedDateTime.toString() output with timezone name in brackets.
 * @param s - The value to check
 * @returns True if the value is a valid ISO zoned date-time string
 */
export function isISODateZoned(s: unknown): s is ISODateZoned {
  return _.isString(s) && REG.isoDateZoned.test(s);
}

/**
 * Checks if a value is a valid ISO 8601 timezone offset string.
 * Valid formats include: "Z", "+05:00", "-05:00"
 * @param s - The value to check
 * @returns True if the value is a valid ISO timezone string
 */
export function isISOTZ(s: unknown): s is ISOTZ {
  return _.isString(s) && REG.isoTz.test(s);
}

/**
 * Checks if a value is a valid GMT timezone offset string.
 * Valid formats include: "GMT-05:00", "GMT+01:00"
 * @param s - The value to check
 * @returns True if the value is a valid GMT timezone string
 */
export function isGMTTZ(s: unknown): s is GMTTZ {
  return _.isString(s) && REG.gmtTz.test(s);
}

/**
 * Checks if a value is a valid PDF timezone offset string.
 * Valid formats include: "Z", "-06'00'", "+0530", "-06"
 * @param s - The value to check
 * @returns True if the value is a valid PDF timezone string
 */
export function isPDFTZ(s: unknown): s is PDFTZ {
  return _.isString(s) && REG.pdfTz.test(s);
}

/**
 * Checks if a value is a valid IANA timezone identifier.
 * Valid formats include: "America/New_York", "Europe/London", "UTC"
 * @param s - The value to check
 * @returns True if the value is a valid IANA timezone string
 */
export function isIANATZ(s: unknown): s is IANATZ {
  return _.isString(s) && REG.ianaTz.test(s);
}

/**
 * Casts a number to a GoogleSheetsDate type.
 * Throws an error if the value is not a valid Google Sheets date.
 * @param value - The number to cast
 * @returns The value as a GoogleSheetsDate
 * @throws Error if the value is not a valid Google Sheets date
 */
export function asGoogleSheetsDate(value: number): GoogleSheetsDate {
  if (!isValidGoogleSheetsDate(value)) {
    throw new Error(`Invalid Google Sheets Date: ${value}`);
  }
  return value as GoogleSheetsDate;
}

/**
 * Type guard to check if a value is a valid Google Sheets date.
 * Google Sheets dates are serial numbers representing days since Dec 30, 1899.
 * @param value - The value to check
 * @returns True if the value is a valid Google Sheets date
 */
export function isGoogleSheetsDate(value: unknown): value is GoogleSheetsDate {
  return typeof value === 'number' && isValidGoogleSheetsDate(value);
}

/**
 * Validates whether a number is a valid Google Sheets date.
 * Valid dates are between 0 (Dec 30, 1899) and 2958465 (~Dec 31, 9999).
 * @param value - The number to validate
 * @returns True if the value is within the valid Google Sheets date range
 */
export function isValidGoogleSheetsDate(value: number): boolean {
  return (
    Number.isFinite(value) &&
    !isNaN(value) &&
    value >= 0 && // Google Sheets dates are positive numbers
    value <= 2958465 // ~ December 31, 9999 (reasonable upper bound)
  );
}

/**
 * Safely converts a value to a GoogleSheetsDate or returns null.
 * Returns null if the value is not a valid Google Sheets date.
 * @param value - The value to convert
 * @returns The value as a GoogleSheetsDate, or null if invalid
 */
export function safeGoogleSheetsDate(value: unknown): GoogleSheetsDate | null {
  return isGoogleSheetsDate(value) ? value : null;
}

/**
 * Converts a string representation of a date into a `DateTime` object.
 *
 * This function first will convert any ISO 8601 dates to the appropriate Temporal value. If the
 * string is not an ISO Date it will try other parsing techniques.
 *
 * This function is highly flexible and can parse a variety of formats. It is designed to handle
 * common, sometimes ambiguous, date formats that may not strictly adhere to ISO 8601. It can infer
 * missing date and time components, applying sensible defaults.
 *
 * Key features:
 * - Handles various separators (e.g., '-', '_', '/', ' ') for date and time parts.
 * - Parses incomplete dates by defaulting month/day to 1 and time components to 0.
 * - Supports timezone offsets.
 *
 * @param s The date string to convert.
 * @param opts Options for parsing, including separators and default values.
 * @returns A `Date` object, or `undefined` if the string cannot be parsed.
 */
export function stringToDate(s: string, opts?: DateParseOptions): DateTime | undefined {
  const temporal = _.parseTemporalString(s);
  if (temporal) return DateTime.of(temporal);

  // Default options
  const defaultOpts = {
    ymdSep: ['-', '_', '', '/', ' '],
    midSep: [' ', '_', '-'],
    hmsSep: [':', ''],
    offset: 0, // for time components
  };

  // Merge options. Handle tz specifically to avoid lint errors with Required<DateParseOptions> if it's optional
  const options = { ...defaultOpts, ...opts };

  // Combine all allowed separators into a regex pattern
  const allSeparators = [...options.ymdSep, ...options.midSep, ...options.hmsSep].filter(Boolean); // Remove empty strings if they are explicitly allowed as no-separator

  const separatorPattern = allSeparators.length > 0 ? `[${allSeparators.map((s) => `\\${s}`).join('')}]` : '';

  // Regex to capture date and time components, allowing for flexible separators
  // This regex is built to be flexible based on the provided separators.
  // It captures year, month, day, hour, minute, second.
  // The non-capturing groups `(?:...)` allow for optional separators.
  const regex = new RegExp(
    `^(\\d{4})` + // Year (yyyy)
      `(?:${separatorPattern}?(\\d{2}))?` + // Optional month (mm), with optional separator
      `(?:${separatorPattern}?(\\d{2}))?` + // Optional day (dd), with optional separator
      `(?:${separatorPattern}?(\\d{2}))?` + // Optional hour (hh), with optional separator
      `(?:${separatorPattern}?(\\d{2}))?` + // Optional minute (mm), with optional separator
      `(?:${separatorPattern}?(\\d{2}))?` + // Optional second (ss), with optional separator
      `$`,
  );

  const match = s.match(regex);

  if (!match) {
    const d = new Date(s);
    if (_.isValidDate(d)) {
      return DateTime.fromDate(d);
    }
    return undefined;
  }

  // Group 0 is the full match, subsequent groups are captured components
  const year = parseInt(match[1], 10);
  // Changed: Month and day now explicitly default to 1 if not provided.
  const month = match[2] ? parseInt(match[2], 10) : 1;
  const day = match[3] ? parseInt(match[3], 10) : 1;
  const hour = match[4] ? parseInt(match[4], 10) : options.offset;
  const minute = match[5] ? parseInt(match[5], 10) : options.offset;
  const second = match[6] ? parseInt(match[6], 10) : options.offset;

  // Basic validation of components
  if (month < 1 || month > 12) {
    return undefined;
  }
  // Day validation will be handled by Date constructor, but a quick check:
  if (day < 1 || day > 31) {
    // Max 31 for simplicity, Date constructor handles actual month days
    return undefined;
  }
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) {
    return undefined;
  }

  let date: DateTime;
  if (options.tz !== undefined) {
    // Logic from date.ts's DateTime constructor (implicitly from its usage with Date.UTC when tz is present)
    // If opts.tz is defined, it's the offset in minutes.
    // A positive tz means ahead of GMT (e.g., +60 for GMT+1), negative for behind.
    // Date.UTC expects components as UTC.
    // If we want components (Y,M,D,H,Min,S) to represent a specific `tz`,
    // we calculate the true UTC components:
    // UTC_H = H - (tz / 60)
    // UTC_Min = Min - (tz % 60)
    // const offsetHours = Math.floor(options.tz / 60);
    // const offsetMinutes = options.tz % 60 as TzMinutes;

    date = DateTime.fromComponents(year, month, day, hour, minute, second);
    date.setTz(options.tz as TzMinutes);
  } else {
    // Default to local time if opts.tz is not set
    date = DateTime.fromComponents(year, month, day, hour, minute, second);
  }

  // Verify that the day is valid for the given month and year
  // (e.g., 31st of April, or February 30th)
  // We use `getUTCFullYear`, `getUTCMonth`, `getUTCDate` to avoid local timezone issues
  // in this validation, especially if `tz` was explicitly set.
  if (date.year !== year || date.month !== month || date.day !== day) {
    return undefined;
  }

  return date;
}

/**
 * Formats a timezone offset in minutes as an ISO 8601 string.
 * Uses ISO 8601 convention where positive minutes = ahead of UTC.
 * @param m - Timezone offset in minutes (positive = ahead of UTC)
 * @returns ISO 8601 timezone string (e.g., "Z", "+05:00", "-05:00")
 * @example
 * ```typescript
 * formatTzAsISOTZ(0);     // "Z"
 * formatTzAsISOTZ(330);   // "+05:30"
 * formatTzAsISOTZ(-300);  // "-05:00"
 * ```
 */
export function formatTzAsISOTZ(m: TzMinutes): ISOTZ {
  if (m === 0) {
    return 'Z' as ISOTZ;
  }
  return (m < 0 ? '-' : '+') + String(Math.floor(Math.abs(m) / 60)).padStart(2, '0') + ':' +
    String(Math.abs(m) % 60).padStart(2, '0') as ISOTZ;
}

/**
 * Parses an ISO 8601 timezone string to minutes offset.
 * Returns positive minutes for ahead of UTC, negative for behind.
 * @param val - ISO timezone string (e.g., "Z", "+05:00", "-05:00")
 * @returns Timezone offset in minutes, or undefined if parsing fails
 * @example
 * ```typescript
 * parseISOTZ("Z");        // 0
 * parseISOTZ("+05:30");   // 330
 * parseISOTZ("-05:00");   // -300
 * ```
 */
export function parseISOTZ(val: ISOTZ): TzMinutes | undefined {
  const p = val.match(/(Z|((\+|\-)(\d\d):(\d\d)))$/);
  if (p && p.length > 1) {
    if (p[1] === 'Z') {
      return 0 as TzMinutes;
    }
    if (p.length > 4) {
      const pol = p[3] === '+' ? 1 : -1;
      const result = _.asInt(p[4]) * 60 + _.asInt(p[5]);
      return (result ? pol * result : result) as TzMinutes;
    }
  }
}

/**
 * Parses a PDF timezone string to minutes offset.
 * PDF format allows "Z", "-06'00'", "+0530", "-06", etc.
 * Returns positive minutes for ahead of UTC, negative for behind.
 * @param val - PDF timezone string
 * @returns Timezone offset in minutes, or undefined if parsing fails
 * @example
 * ```typescript
 * parsePDFTZ("Z");         // 0
 * parsePDFTZ("-06'00'");   // -360
 * parsePDFTZ("+0530");     // 330
 * ```
 */
export function parsePDFTZ(val: PDFTZ): TzMinutes | undefined {
  const p = val.match(/Z|((\+|\-)(\d\d)(\d\d)?)$/);
  if (p && p.length > 1) {
    if (p[1] === 'Z') {
      return 0 as TzMinutes;
    }
    if (p.length > 3) {
      const pol = p[2] === '-' ? 1 : -1;
      let val = _.asInt(p[3]) * 60;
      if (p.length > 3) {
        val += _.asInt(p[4]);
      }
      return (val ? pol * val : val) as TzMinutes;
    }
  }
}

/**
 * Parses a timezone string from command-line-style input and returns the offset
 * in minutes from UTC. Handles numeric offset formats like `-6h`, `-06:00`,
 * `-6h30`, `+6h`, `6`, `6h` (unsigned defaults to positive / ahead of UTC).
 * Also accepts IANA timezone names (e.g. `"America/Chicago"`, `"chicago"`) via
 * {@link resolveIANATZ} and resolves them to their current numeric offset using
 * Temporal.
 * @param val - The timezone string to parse
 * @returns Timezone offset in minutes, or undefined if parsing fails
 */
export function parseTzString(val: string): TzMinutes | undefined {
  if (!_.isString(val)) return undefined;

  if (val === 'Z' || val === 'z') return 0 as TzMinutes;

  const offset = parseTzOffset(val);
  if (offset !== undefined) return offset;

  const iana = resolveIANATZ(val);
  if (iana) {
    try {
      const zdt = Temporal.Now.zonedDateTimeISO(iana);
      const offsetMinutes = Number(zdt.offsetNanoseconds) / 60_000_000_000;
      return Math.round(offsetMinutes) as TzMinutes;
    } catch {
      return undefined;
    }
  }

  return undefined;
}

/**
 * Parses a numeric timezone offset string.
 * Supports formats: `[±]HH`, `[±]HHh`, `[±]HHhMM`, `[±]HH:MM`.
 * @internal
 */
function parseTzOffset(val: string): TzMinutes | undefined {
  const m1 = val.match(/^([+-])?(\d+)(?:h(\d+)?)?$/i);
  if (m1) {
    const sign = m1[1] === '-' ? -1 : 1;
    const hours = _.asInt(m1[2]);
    const minutes = m1[3] !== undefined ? _.asInt(m1[3]) : 0;
    if (hours > 24 || minutes > 59) return undefined;
    return (sign * (hours * 60 + minutes)) as TzMinutes;
  }

  const m2 = val.match(/^([+-])?(\d{2}):(\d{2})$/);
  if (m2) {
    const sign = m2[1] === '-' ? -1 : 1;
    const hours = _.asInt(m2[2]);
    const minutes = _.asInt(m2[3]);
    if (hours > 23 || minutes > 59) return undefined;
    return (sign * (hours * 60 + minutes)) as TzMinutes;
  }

  return undefined;
}

/**
 * Resolves a timezone identifier to a full IANA timezone name.
 * Accepts full IANA names (e.g. `"America/Chicago"`) or case-insensitive
 * partial matches (e.g. `"chicago"`, `"new_york"`).
 * Uses `Intl.supportedValuesOf('timeZone')` for available timezone discovery,
 * avoiding any hardcoded timezone list.
 * @param val - The timezone identifier to resolve
 * @returns The full IANA timezone name, or undefined if no match
 */
export function resolveIANATZ(val: string): IANATZ | undefined {
  if (!_.isString(val)) return undefined;

  let timezones: string[];
  try {
    timezones = Intl.supportedValuesOf('timeZone');
  } catch {
    return undefined;
  }

  const lower = val.toLowerCase();

  const exact = timezones.find((tz) => tz.toLowerCase() === lower);
  if (exact) return exact as IANATZ;

  const matches = timezones.filter((tz) => tz.toLowerCase().includes(lower));
  if (matches.length === 1) {
    return matches[0] as IANATZ;
  }

  return undefined;
}
