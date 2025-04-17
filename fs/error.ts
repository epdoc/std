import type { ICodeError, ICodeErrorOptions } from './dep/epdoc.ts';
import { isError } from './dep/epdoc.ts';

export interface FSErrorOptions extends ICodeErrorOptions {
  code?: string;
  path?: string;
}

export class FSError extends Error implements ICodeError {
  code: string | undefined;
  path: string | undefined;

  constructor(err: string | Error, opts: FSErrorOptions = {}) {
    super(isError(err) ? (err.message as string) : err, opts);
    // @ts-ignore some errors have a code
    if (err.code) this.code = err.code;
    if (opts.code) this.code = opts.code;
    this.path = opts.path;
  }
}
