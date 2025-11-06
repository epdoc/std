import { timeThresholds } from './consts.ts';
import { getTranslations } from './i18n.ts';
import type * as Humanize from './types.ts';

/**
 * Converts a duration in milliseconds to a human-readable string.
 *
 * Uses intelligent thresholds to provide contextually appropriate descriptions
 * like "now", "a moment", "about 5 minutes", "over an hour", etc.
 *
 * @param ms - Duration in milliseconds (negative values represent past durations)
 * @param options - Configuration options or legacy boolean for withSuffix
 * @returns Human-readable duration string
 *
 * @example
 * ```typescript
 * // Basic usage
 * humanize(0); // "now"
 * humanize(30000); // "30 seconds"
 * humanize(300000); // "about 5 minutes"
 *
 * // With suffixes for past/future context
 * humanize(30000, true); // "in 30 seconds"
 * humanize(-30000, true); // "30 seconds ago"
 *
 * // Internationalization
 * humanize(30000, { locale: 'fr' }); // "30 secondes"
 * humanize(30000, { locale: 'es', withSuffix: true }); // "en 30 segundos"
 * ```
 */
export function humanize(ms: number, options: Humanize.Options | boolean = {}): string {
  // Handle legacy boolean parameter for withSuffix
  const opts = typeof options === 'boolean' ? { withSuffix: options } : options;
  const { locale = 'en', withSuffix = false } = opts;

  const isNegative = ms < 0;
  const absoluteMs = Math.abs(ms);
  const translations = getTranslations(locale);

  // Find the appropriate threshold
  let selectedThreshold = timeThresholds[0];
  for (const threshold of timeThresholds) {
    if (absoluteMs <= threshold.threshold) {
      selectedThreshold = threshold;
      break;
    }
  }

  // If we exceed the largest threshold, use the last one
  if (absoluteMs > timeThresholds[timeThresholds.length - 1].threshold) {
    selectedThreshold = timeThresholds[timeThresholds.length - 1];
    // For very large values, use years
    const years = Math.round(absoluteMs / (365.25 * 24 * 60 * 60 * 1000));
    const base = translations.aboutYears(years);

    if (!withSuffix) return base;
    return isNegative ? translations.suffixAgo(base) : translations.suffixIn(base);
  }

  const base = selectedThreshold.getBaseString(absoluteMs, locale);

  if (!withSuffix) return base;

  if (base === translations.now) return base;

  return isNegative ? translations.suffixAgo(base) : translations.suffixIn(base);
}
