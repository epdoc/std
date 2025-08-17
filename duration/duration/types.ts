import type * as Time from '../consts.ts';

export type Field = keyof typeof Time.Measures;

export type RecordOptions = Partial<{
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
  microseconds: number;
  nanoseconds: number;
}>;

export type Part = {
  type: 'literal' | 'integer' | 'unit' | 'decimal' | 'fraction';
  value: string;
  unit?: Field;
};
