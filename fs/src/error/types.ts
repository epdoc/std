import type { Path } from '../types.ts';

export interface FSErrorOptions {
  cause?: string;
  code?: string | number;
  path?: Path;
}
