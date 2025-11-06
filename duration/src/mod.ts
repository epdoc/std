/**
 * This module exports the public API for the duration workspace.
 * @module
 */
export * as Time from './consts.ts';
export * as Duration from './duration/mod.ts';
export * as Format from './format.ts';
export { humanize, type HumanizeOptions } from './duration/humanize.ts';
export { getTranslations, supportedLocales, type HumanizeTranslations } from './duration/i18n.ts';
export * from './time-types.ts';
export { compareFields, duration, isEpochMilliseconds, isEpochSeconds, isField, isMilliseconds } from './utils.ts';
