/**
 * This module exports the public API for the duration workspace.
 * @module
 */
export * as Time from './consts.ts';
export * as Format from './duration/format.ts';
export { supportedLocales } from './duration/i18n.ts';
export * as Duration from './duration/mod.ts';
export * from './humanize/mod.ts';
export * from './time-types.ts';
export { compareFields, duration, isEpochMilliseconds, isEpochSeconds, isField, isMilliseconds } from './utils.ts';
