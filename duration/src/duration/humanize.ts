import { getTranslations } from './i18n.ts';

interface TimeThreshold {
  threshold: number;
  getBaseString: (value: number, locale: string) => string;
}

const timeThresholds: TimeThreshold[] = [
  // Immediate range - high precision
  {
    threshold: 0,
    getBaseString: (_, locale) => getTranslations(locale).now,
  },
  {
    threshold: 2000,
    getBaseString: (_, locale) => getTranslations(locale).moment,
  },

  // Second scale - precise around the 1-minute boundary
  {
    threshold: 52.5 * 1000, // Under a minute
    getBaseString: (ms, locale) => {
      const seconds = Math.round(ms / 1000);
      return getTranslations(locale).aboutSeconds(seconds);
    },
  },
  // Minute scale - precise around the 1-minute boundary
  {
    threshold: 70 * 1000,
    getBaseString: (_, locale) => getTranslations(locale).aboutMinute,
  },
  {
    threshold: 90 * 1000,
    getBaseString: (_, locale) => getTranslations(locale).overMinute,
  },
  {
    threshold: 110 * 1000,
    getBaseString: (_, locale) => getTranslations(locale).underMinutes(2),
  },

  // Minutes 2-59 - use actual numbers
  {
    threshold: 57 * 60 * 1000, // Just under 1 hour
    getBaseString: (ms, locale) => {
      const minutes = Math.round(ms / (60 * 1000));
      return getTranslations(locale).aboutMinutes(minutes);
    },
  },

  // Hour scale - precise around the 1-hour boundary
  {
    threshold: 1.2 * 60 * 60 * 1000, // 1.2 hours
    getBaseString: (_, locale) => getTranslations(locale).aboutHour,
  },
  {
    threshold: 1.5 * 60 * 60 * 1000, // 1.5 hours
    getBaseString: (_, locale) => getTranslations(locale).overHour,
  },

  // Hours 3-23 - use actual numbers
  {
    threshold: 23.49 * 60 * 60 * 1000, // 23.5 hours
    getBaseString: (ms, locale) => {
      const hours = Math.round(ms / (60 * 60 * 1000));
      return getTranslations(locale).aboutHours(hours);
    },
  },

  // Day scale - precise around the 1-day boundary
  {
    threshold: 1.1 * 24 * 60 * 60 * 1000, // 1.1 days
    getBaseString: (_, locale) => getTranslations(locale).aboutDay,
  },
  {
    threshold: 1.5 * 24 * 60 * 60 * 1000, // 1.5 days
    getBaseString: (_, locale) => getTranslations(locale).overDay,
  },

  // Days 2-13 - use actual numbers
  {
    threshold: 13.5 * 24 * 60 * 60 * 1000, // 13.5 days
    getBaseString: (ms, locale) => {
      const days = Math.round(ms / (24 * 60 * 60 * 1000));
      return getTranslations(locale).aboutDays(days);
    },
  },

  // Week scale - switch around 2 weeks
  {
    threshold: 7.5 * 7 * 24 * 60 * 60 * 1000,
    getBaseString: (ms, locale) => {
      const weeks = Math.round(ms / (7 * 24 * 60 * 60 * 1000));
      return getTranslations(locale).aboutWeeks(weeks);
    },
  },

  // Month scale
  {
    threshold: 49 * 7 * 24 * 60 * 60 * 1000, // 11.5 months
    getBaseString: (ms, locale) => {
      const months = Math.round(ms / (30 * 24 * 60 * 60 * 1000));
      return getTranslations(locale).aboutMonths(months);
    },
  },

  // Year scale
  {
    threshold: 1.2 * 365 * 24 * 60 * 60 * 1000, // 1.2 years
    getBaseString: (_, locale) => getTranslations(locale).aboutYear,
  },
  {
    threshold: 1.5 * 365 * 24 * 60 * 60 * 1000, // 1.5 years
    getBaseString: (_, locale) => getTranslations(locale).overYear,
  },
];

export interface HumanizeOptions {
  locale?: string;
  withSuffix?: boolean;
}

export function humanize(ms: number, options: HumanizeOptions | boolean = {}): string {
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
