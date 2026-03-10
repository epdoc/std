import { _ } from '@epdoc/type';
import * as Const from './consts.ts';
import type * as Progress from './types.ts';

export function isSpinner(val: unknown): val is Progress.SpinnerOptions {
  return _.isDict(val) && val.type === 'spinner' && _.isIntegerInRange(val.index, 0, Const.blocks.spinner.length - 1);
}
export function isBounce(val: unknown): val is Progress.BounceOptions {
  return _.isDict(val) && val.type === 'bounce' && _.isIntegerInRange(val.index, 0, Const.blocks.bounce.length - 1);
}
export function isHorizontal(val: unknown): val is Progress.HorizontalOptions {
  return _.isDict(val) && val.type === 'horizontal' && _.isNumber(val.total) && _.isPosInteger(val.width);
}
export function isVertical(val: unknown): val is Progress.VerticalOptions {
  return _.isDict(val) && val.type === 'vertical' && _.isNumber(val.total);
}
