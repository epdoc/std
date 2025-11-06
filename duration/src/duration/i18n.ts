import type * as Format from './format.ts';

/**
 * Internationalization support for duration formatter
 */

export interface FormatterTranslations {
  yearSuffix: string;
  daySuffix: string;
  hourSuffix: string;
  minuteSuffix: string;
  secondSuffix: string;
  millisecondSuffix: string;
  separator: string;
}
export type FormatterTranslationKeys =
  | 'yearSuffix'
  | 'daySuffix'
  | 'hourSuffix'
  | 'minuteSuffix'
  | 'secondSuffix'
  | 'millisecondSuffix'
  | 'separator';

export const translations: Record<string, FormatterTranslations> = {
  en: {
    yearSuffix: 'y',
    daySuffix: 'd',
    hourSuffix: 'h',
    minuteSuffix: 'm',
    secondSuffix: 's',
    millisecondSuffix: 'ms',
    separator: ', ',
  },

  fr: {
    yearSuffix: 'a',
    daySuffix: 'j',
    hourSuffix: 'h',
    minuteSuffix: 'm',
    secondSuffix: 's',
    millisecondSuffix: 'ms',
    separator: ', ',
  },

  es: {
    yearSuffix: 'a',
    daySuffix: 'd',
    hourSuffix: 'h',
    minuteSuffix: 'm',
    secondSuffix: 's',
    millisecondSuffix: 'ms',
    separator: ', ',
  },

  zh: {
    yearSuffix: '年',
    daySuffix: '天',
    hourSuffix: '时',
    minuteSuffix: '分',
    secondSuffix: '秒',
    millisecondSuffix: '毫秒',
    separator: '、',
  },
} as const;

export function translate(locale: string, key: FormatterTranslationKeys, _style?: Format.DurationUnitStyle) {
  const t: FormatterTranslations = translations[locale] ? translations[locale] : translations.en;
  return t[key];
}

export const supportedLocales: string[] = Object.keys(translations);
