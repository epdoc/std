import type * as Custom from './format.ts';
import type * as Intl2 from './intl.ts';

// --- Conversion Method ---

/**
 * Converts custom Options object into the standard Intl.DurationFormatOptions object.
 * It filters out custom non-standard properties like separators and display limits.
 *
 * @param options The custom Options object.
 * @returns A standard Intl.DurationFormatOptions object.
 */
export function convertOptionsToDurationFormat(
  options: Custom.DurationFormatOptions,
): Intl2.DurationFormatOptions {
  const result: Intl2.DurationFormatOptions = {
    style: options.style,
    numberingSystem: options.numberingSystem,
    fractionalDigits: options.fractionalDigits,
    // Years
    years: options.years,
    yearsDisplay: options.yearsDisplay,
    // Days (weeks, months are supported by Intl, but not defined in your BaseOptions)
    days: options.days,
    daysDisplay: options.daysDisplay,
    // Hours
    hours: options.hours,
    hoursDisplay: options.hoursDisplay,
    // Minutes
    minutes: options.minutes,
    minutesDisplay: options.minutesDisplay,
    // Seconds
    seconds: options.seconds,
    secondsDisplay: options.secondsDisplay,
    // Sub-seconds
    millisecondsDisplay: options.millisecondsDisplay,
    microsecondsDisplay: options.microsecondsDisplay,
    nanosecondsDisplay: options.nanosecondsDisplay,
    // methods
  };
  return result;
}
