import * as Time from '../consts.ts';
import type * as Duration from './types.ts';

export const Fields = Object.keys(Time.Measures) as Duration.Field[];
