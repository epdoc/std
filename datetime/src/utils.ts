import { _ } from '@epdoc/type';
import type { DateParseOptions, GMTTZ, GoogleSheetsDate, IANATZ, ISODate, ISOTZ, PDFTZ, TzMinutes } from './types.ts';

const REG = {
  isoDate: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|([+-]\d{2}:\d{2}))?$/,
  isoTz: /^(Z|((\+|\-)(\d\d):(\d\d)))$/,
  gmtTz: /GMT([+-])(\d{1,2}):?(\d{2})?/,
  pdfTz: /Z|((\+|\-)(\d\d)(\d\d)?)$/,
  ianaTz: /^[A-Za-z_]+\/[A-Za-z_]+$/,
};

export function isISODate(s: unknown): s is ISODate {
  return _.isString(s) && REG.isoDate.test(s);
}

export function isISOTZ(s: unknown): s is ISOTZ {
  return _.isString(s) && REG.isoTz.test(s);
}

export function isGMTTZ(s: unknown): s is GMTTZ {
  return _.isString(s) && REG.gmtTz.test(s);
}

export function isPDFTZ(s: unknown): s is PDFTZ {
  return _.isString(s) && REG.pdfTz.test(s);
}

export function isIANATZ(s: unknown): s is IANATZ {
  return _.isString(s) && REG.ianaTz.test(s);
}

export function asGoogleSheetsDate(value: number): GoogleSheetsDate {
  if (!isValidGoogleSheetsDate(value)) {
    throw new Error(`Invalid Google Sheets Date: ${value}`);
  }
  return value as GoogleSheetsDate;
}

export function isGoogleSheetsDate(value: unknown): value is GoogleSheetsDate {
  return typeof value === 'number' && isValidGoogleSheetsDate(value);
}

export function isValidGoogleSheetsDate(value: number): boolean {
  return (
    Number.isFinite(value) &&
    !isNaN(value) &&
    value >= 0 && // Google Sheets dates are positive numbers
    value <= 2958465 // ~ December 31, 9999 (reasonable upper bound)
  );
}

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
export function formatTzAsISOTZ(m: TzMinutes): ISOTZ {
  if (m === 0) {
    return 'Z' as ISOTZ;
  }
  return (m < 0 ? '+' : '-') + String(Math.floor(Math.abs(m) / 60)).padStart(2, '0') + ':' +
    String(Math.abs(m) % 60).padStart(2, '0') as ISOTZ;
}

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
