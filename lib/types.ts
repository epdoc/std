import { Integer, isInteger } from '@epdoc/typeutil';

export type Milliseconds = Integer;
export type HrMilliseconds = number;
export type EpochMilliseconds = Integer;
export type EpochSeconds = Integer;

export function isMilliseconds(val: unknown): val is Milliseconds {
  return isInteger(val);
}

export function isEpochMilliseconds(val: unknown): val is EpochMilliseconds {
  return isInteger(val);
}

export function isEpochSeconds(val: unknown): val is EpochSeconds {
  return isInteger(val);
}
