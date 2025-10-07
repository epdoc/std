import { type IError, isError } from '@epdoc/type';

export interface FSErrorOptions {
  cause?: string;
  code?: string | number;
  path?: string;
}

export class FSError extends Error implements IError {
  code: string | number | undefined;
  path: string | undefined;

  constructor(err: string | Error, opts: FSErrorOptions = {}) {
    super(isError(err) ? (err.message as string) : err, opts);
    // @ts-ignore some errors have a code
    if (err.code) this.code = err.code;
    if (opts.code) this.code = opts.code;
    this.path = opts.path;
  }
}
