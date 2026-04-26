import { _ } from '@epdoc/type';
import type { DateParseOptions, GMTTZ, GoogleSheetsDate, IANATZ, ISODate, ISOTZ, PDFTZ, TzMinutes } from './types.ts';

const REG = {
  isoDate: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|([+-]\d{2}:\d{2}))?$/,
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
 * Converts a string representation of a date into a `Date` object.
 *
 * This function is highly flexible and can parse a variety of formats. It is
 * designed to handle common, sometimes ambiguous, date formats that may not
 * strictly adhere to ISO 8601. It can infer missing date and time components,
 * applying sensible defaults.
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
export function stringToDate(s: string, opts?: DateParseOptions): Date | undefined {
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
    // If it's an ISO 8601 string, let Date() handle it.
    // This is a basic check to prevent parsing common ISO formats.
    // ISO 8601 typically includes 'T' for time separator or 'Z' for UTC.
    if (isISODate(s)) {
      const d = new Date(s);
      // Verify if the native Date constructor actually produced a valid date
      if (!isNaN(d.getTime())) {
        return d;
      }
    }
    return undefined; // Does not match our custom format or is an invalid ISO string
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

  let date: Date;
  if (options.tz !== undefined) {
    // Logic from date.ts's DateEx constructor (implicitly from its usage with Date.UTC when tz is present)
    // If opts.tz is defined, it's the offset in minutes.
    // A positive tz means ahead of GMT (e.g., +60 for GMT+1), negative for behind.
    // Date.UTC expects components as UTC.
    // If we want components (Y,M,D,H,Min,S) to represent a specific `tz`,
    // we calculate the true UTC components:
    // UTC_H = H - (tz / 60)
    // UTC_Min = Min - (tz % 60)
    const offsetHours = Math.floor(options.tz / 60);
    const offsetMinutes = options.tz % 60;

    date = new Date(Date.UTC(year, month - 1, day, hour - offsetHours, minute - offsetMinutes, second));
  } else {
    // Default to local time if opts.tz is not set
    date = new Date(year, month - 1, day, hour, minute, second);
  }

  // Verify that the day is valid for the given month and year
  // (e.g., 31st of April, or February 30th)
  // We use `getUTCFullYear`, `getUTCMonth`, `getUTCDate` to avoid local timezone issues
  // in this validation, especially if `tz` was explicitly set.
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
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
  return (m < 0 ? '+' : '-') + String(Math.floor(Math.abs(m) / 60)).padStart(2, '0') + ':' +
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
      const pol = p[3] === '-' ? 1 : -1;
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
