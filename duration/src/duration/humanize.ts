import type { HrMilliseconds, Milliseconds } from '../time-types.ts';

/**
 * Convert duration to human-readable text (e.g., "2 hours", "about 3 minutes").
 * Uses intelligent "about" prefix for significantly rounded values.
 *
 * @param ms - The duration in milliseconds
 * @param withSuffix - Whether to add "ago" or "in" suffix based on sign
 * @returns Human-readable duration string
 *
 * @example
 * ```ts
 * humanize(0) // "now"
 * humanize(1000) // "a second"
 * humanize(90000) // "about 2 minutes" (1.5 min rounded)
 * humanize(120000) // "2 minutes" (exact)
 * humanize(5400000, true) // "in about 2 hours"
 * humanize(-90000, true) // "about 2 minutes ago"
 * ```
 */
export function humanize(ms: Milliseconds | HrMilliseconds, withSuffix: boolean = false): string {
  const absMs = Math.abs(ms);
  const isNegative = ms < 0;

  // Handle zero duration
  if (absMs === 0) {
    const base = 'now';
    if (!withSuffix) return base;
    return base; // "now" doesn't need suffix
  }

  // Handle sub-second durations
  if (absMs < 1000) {
    const base = 'a moment';
    if (!withSuffix) return base;
    return isNegative ? `${base} ago` : `in ${base}`;
  }

  // Handle 1-44 seconds
  if (absMs < 45000) {
    const seconds = Math.round(absMs / 1000);
    const base = seconds === 1 ? 'a second' : `${seconds} seconds`;
    if (!withSuffix) return base;
    return isNegative ? `${base} ago` : `in ${base}`;
  }

  if (absMs < 55000) { // 45-89 seconds
    const base = 'less than a minute';
    if (!withSuffix) return base;
    return isNegative ? `${base} ago` : `in ${base}`;
  }

  if (absMs < 65000) { // 45-89 seconds
    const base = 'a minute';
    if (!withSuffix) return base;
    return isNegative ? `${base} ago` : `in ${base}`;
  }

  if (absMs < 90000) { // 45-89 seconds
    const base = 'over a minute';
    if (!withSuffix) return base;
    return isNegative ? `${base} ago` : `in ${base}`;
  }

  if (absMs < 2700000) { // < 45 minutes
    const minutes = Math.round(absMs / 60000);
    const exactMinutes = absMs / 60000;
    const diff = Math.abs(minutes - exactMinutes);
    // Use "about" when rounding changes the value significantly (>20% off)
    const base = diff > 0.2 ? `about ${minutes} minutes` : `${minutes} minutes`;
    if (!withSuffix) return base;
    return isNegative ? `${base} ago` : `in ${base}`;
  }

  if (absMs < 5400000) { // 45-89 minutes
    const base = 'an hour';
    if (!withSuffix) return base;
    return isNegative ? `${base} ago` : `in ${base}`;
  }

  if (absMs < 129600000) { // < 36 hours (1.5 days)
    const hours = Math.round(absMs / 3600000);
    const exactHours = absMs / 3600000;
    const diff = Math.abs(hours - exactHours);
    // Use "about" when rounding changes the value significantly (>20% off)
    const base = diff > 0.2 ? `about ${hours} hours` : `${hours} hours`;
    if (!withSuffix) return base;
    return isNegative ? `${base} ago` : `in ${base}`;
  }

  if (absMs < 259200000) { // 36-71 hours
    const base = 'a day';
    if (!withSuffix) return base;
    return isNegative ? `${base} ago` : `in ${base}`;
  }

  if (absMs < 15552000000) { // < 180 days (6 months)
    const days = Math.round(absMs / 86400000);
    const exactDays = absMs / 86400000;
    const diff = Math.abs(days - exactDays);
    // Use "about" when rounding changes the value significantly (>20% off)
    const base = diff > 0.2 ? `about ${days} days` : `${days} days`;
    if (!withSuffix) return base;
    return isNegative ? `${base} ago` : `in ${base}`;
  }

  const years = Math.round(absMs / (365.25 * 24 * 60 * 60 * 1000));
  const base = years === 1 ? 'a year' : `${years} years`;
  if (!withSuffix) return base;
  return isNegative ? `${base} ago` : `in ${base}`;
}
