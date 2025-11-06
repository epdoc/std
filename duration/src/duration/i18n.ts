/**
 * Internationalization support for humanize function
 */

export interface HumanizeTranslations {
  now: string;
  moment: string;
  aboutSeconds: (n: number) => string;
  seconds: (n: number) => string;
  aboutMinute: string;
  overMinute: string;
  underMinutes: (n: number) => string;
  aboutMinutes: (n: number) => string;
  minutes: (n: number) => string;
  aboutHour: string;
  overHour: string;
  aboutHours: (n: number) => string;
  hours: (n: number) => string;
  aboutDay: string;
  overDay: string;
  aboutDays: (n: number) => string;
  days: (n: number) => string;
  aboutWeeks: (n: number) => string;
  aboutMonths: (n: number) => string;
  months: (n: number) => string;
  aboutYear: string;
  overYear: string;
  aboutYears: (n: number) => string;
  suffixAgo: (text: string) => string;
  suffixIn: (text: string) => string;
}

const translations: Record<string, HumanizeTranslations> = {
  en: {
    now: 'now',
    moment: 'a moment',
    aboutSeconds: (n) => n <= 10 ? `about ${n} seconds` : `${n} seconds`,
    seconds: (n) => `${n} seconds`,
    aboutMinute: 'about a minute',
    overMinute: 'over a minute',
    underMinutes: (n) => `under ${n} minutes`,
    aboutMinutes: (n) => n <= 10 ? `about ${n} minutes` : `${n} minutes`,
    minutes: (n) => `${n} minutes`,
    aboutHour: 'about an hour',
    overHour: 'over an hour',
    aboutHours: (n) => n <= 10 ? `about ${n} hours` : `${n} hours`,
    hours: (n) => `${n} hours`,
    aboutDay: 'about a day',
    overDay: 'over a day',
    aboutDays: (n) => n <= 7 ? `about ${n} days` : `${n} days`,
    days: (n) => `${n} days`,
    aboutWeeks: (n) => `about ${n} weeks`,
    aboutMonths: (n) => n <= 3 ? `about ${n} months` : `${n} months`,
    months: (n) => `${n} months`,
    aboutYear: 'about a year',
    overYear: 'over a year',
    aboutYears: (n) => `about ${n} years`,
    suffixAgo: (text) => `${text} ago`,
    suffixIn: (text) => `in ${text}`,
  },
  
  fr: {
    now: 'maintenant',
    moment: 'un instant',
    aboutSeconds: (n) => n <= 10 ? `environ ${n} secondes` : `${n} secondes`,
    seconds: (n) => `${n} secondes`,
    aboutMinute: 'environ une minute',
    overMinute: 'plus d\'une minute',
    underMinutes: (n) => `moins de ${n} minutes`,
    aboutMinutes: (n) => n <= 10 ? `environ ${n} minutes` : `${n} minutes`,
    minutes: (n) => `${n} minutes`,
    aboutHour: 'environ une heure',
    overHour: 'plus d\'une heure',
    aboutHours: (n) => n <= 10 ? `environ ${n} heures` : `${n} heures`,
    hours: (n) => `${n} heures`,
    aboutDay: 'environ un jour',
    overDay: 'plus d\'un jour',
    aboutDays: (n) => n <= 7 ? `environ ${n} jours` : `${n} jours`,
    days: (n) => `${n} jours`,
    aboutWeeks: (n) => `environ ${n} semaines`,
    aboutMonths: (n) => n <= 3 ? `environ ${n} mois` : `${n} mois`,
    months: (n) => `${n} mois`,
    aboutYear: 'environ un an',
    overYear: 'plus d\'un an',
    aboutYears: (n) => `environ ${n} ans`,
    suffixAgo: (text) => `il y a ${text}`,
    suffixIn: (text) => `dans ${text}`,
  },
  
  es: {
    now: 'ahora',
    moment: 'un momento',
    aboutSeconds: (n) => n <= 10 ? `cerca de ${n} segundos` : `${n} segundos`,
    seconds: (n) => `${n} segundos`,
    aboutMinute: 'cerca de un minuto',
    overMinute: 'más de un minuto',
    underMinutes: (n) => `menos de ${n} minutos`,
    aboutMinutes: (n) => n <= 10 ? `cerca de ${n} minutos` : `${n} minutos`,
    minutes: (n) => `${n} minutos`,
    aboutHour: 'cerca de una hora',
    overHour: 'más de una hora',
    aboutHours: (n) => n <= 10 ? `cerca de ${n} horas` : `${n} horas`,
    hours: (n) => `${n} horas`,
    aboutDay: 'cerca de un día',
    overDay: 'más de un día',
    aboutDays: (n) => n <= 7 ? `cerca de ${n} días` : `${n} días`,
    days: (n) => `${n} días`,
    aboutWeeks: (n) => `cerca de ${n} semanas`,
    aboutMonths: (n) => n <= 3 ? `cerca de ${n} meses` : `${n} meses`,
    months: (n) => `${n} meses`,
    aboutYear: 'cerca de un año',
    overYear: 'más de un año',
    aboutYears: (n) => `cerca de ${n} años`,
    suffixAgo: (text) => `hace ${text}`,
    suffixIn: (text) => `en ${text}`,
  },
  
  zh: {
    now: '现在',
    moment: '片刻',
    aboutSeconds: (n) => n <= 10 ? `大约${n}秒` : `${n}秒`,
    seconds: (n) => `${n}秒`,
    aboutMinute: '大约一分钟',
    overMinute: '超过一分钟',
    underMinutes: (n) => `不到${n}分钟`,
    aboutMinutes: (n) => n <= 10 ? `大约${n}分钟` : `${n}分钟`,
    minutes: (n) => `${n}分钟`,
    aboutHour: '大约一小时',
    overHour: '超过一小时',
    aboutHours: (n) => n <= 10 ? `大约${n}小时` : `${n}小时`,
    hours: (n) => `${n}小时`,
    aboutDay: '大约一天',
    overDay: '超过一天',
    aboutDays: (n) => n <= 7 ? `大约${n}天` : `${n}天`,
    days: (n) => `${n}天`,
    aboutWeeks: (n) => `大约${n}周`,
    aboutMonths: (n) => n <= 3 ? `大约${n}个月` : `${n}个月`,
    months: (n) => `${n}个月`,
    aboutYear: '大约一年',
    overYear: '超过一年',
    aboutYears: (n) => `大约${n}年`,
    suffixAgo: (text) => `${text}前`,
    suffixIn: (text) => `${text}后`,
  },
};

export function getTranslations(locale: string): HumanizeTranslations {
  return translations[locale] || translations.en;
}

export const supportedLocales = Object.keys(translations);
