/**
 * This file contains constants for time measurements and ratios.
 * @module
 */

/**
 * The number of seconds in a solar year.
 */
export const SECONDS_PER_SOLAR_YEAR = ((365 * 24 + 5) * 60 + 48) * 60 + 46;
export const SECONDS_PER_CALENDAR_YEAR = (365.25 * 24) * 3600;

/**
 * A record of time measurements in milliseconds.
 */
export const Measures: Record<string, number> = {
  // years: SECONDS_PER_YEAR * 1000,
  // months: Math.floor((SECONDS_PER_YEAR * 1000) / 12),
  // weeks: 7 * 24 * 3600 * 1000,
  years: SECONDS_PER_CALENDAR_YEAR * 1000,
  days: 24 * 3600 * 1000,
  hours: 3600 * 1000,
  minutes: 60 * 1000,
  seconds: 1000,
  milliseconds: 1,
  microseconds: 1 / 1000,
  nanoseconds: 1 / 1000000,
} as const;

/**
 * A record of time ratios.
 */
export const Ratios: Record<string, number> = {
  // years: SECONDS_PER_YEAR * 1000,
  // months: Math.floor((SECONDS_PER_YEAR * 1000) / 12),
  // weeks: 7 * 24 * 3600 * 1000,
  days: 365.25, // Average days per year for modulo calculation
  hours: 24,
  minutes: 60,
  seconds: 60,
  milliseconds: 1000,
  microseconds: 1000,
  nanoseconds: 1000,
} as const;
