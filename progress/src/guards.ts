import { _ } from '@epdoc/type';
import * as Const from './consts.ts';
import type * as Progress from './types.ts';

export function isSpinnerType(val: unknown): val is Progress.Spinner {
  return _.isString(val) && val in Const.blocks.spinner;
}
export function isBounceType(val: unknown): val is Progress.Bounce {
  return _.isString(val) && val in Const.blocks.bounce;
}

export function isSpinner(val: unknown): val is Progress.SpinnerOptions {
  return _.isDict(val) && val.type === 'spinner' && isSpinnerType(val.index);
}
export function isBounce(val: unknown): val is Progress.BounceOptions {
  return _.isDict(val) && val.type === 'bounce' && isBounceType(val.index);
}
export function isHorizontal(val: unknown): val is Progress.HorizontalOptions {
  return _.isDict(val) && val.type === 'horizontal' && _.isNumber(val.total) && _.isPosInteger(val.width);
}
export function isVertical(val: unknown): val is Progress.VerticalOptions {
  return _.isDict(val) && val.type === 'vertical' && _.isNumber(val.total);
}
