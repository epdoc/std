/**
 * This module exports the public API for the duration workspace.
 * @module
 */
export * as Time from './consts.ts';
export * as Duration from './duration/mod.ts';
export * as Format from './format.ts';
export { humanize } from './duration/humanize.ts';
export * from './time-types.ts';
export { compareFields, duration, isEpochMilliseconds, isEpochSeconds, isField, isMilliseconds } from './utils.ts';
