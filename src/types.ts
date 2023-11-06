import { Integer, isInteger } from 'epdoc-util';

export type Milliseconds = Integer;
export type EpochMilliseconds = Integer;
export type EpochSeconds = Integer;

export function isMilliseconds(val: any): val is Milliseconds {
  return isInteger(val);
}

export function isEpochMilliseconds(val: any): val is EpochMilliseconds {
  return isInteger(val);
}

export function isEpochSeconds(val: any): val is EpochSeconds {
  return isInteger(val);
}
