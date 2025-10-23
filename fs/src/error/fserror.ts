import { type IError, isError } from '@epdoc/type';
import type { FSErrorOptions } from './types.ts';

export class FSError extends Error implements IError {
  code: string | number | undefined;
  path: string | undefined;

  constructor(err: string | Error | unknown, opts: FSErrorOptions = {}) {
    // Normalize message
    const message = isError(err) ? (err.message as string) : String(err ?? '');

    // Pass ErrorOptions compatible shape (keep `.cause` for Node)
    // Note: we intentionally do not rely on runtime-specific globals.
    // The opts.cause is preserved in FSErrorOptions and also forwarded to Error when supported.
    super(message, { cause: opts.cause });

    // Narrow type for platform errors that may include a code
    type ErrWithCode = { code?: string | number; errno?: number | string; message?: string };
    const maybe = err as ErrWithCode;

    if (maybe && (maybe.code !== undefined || maybe.errno !== undefined)) {
      this.code = typeof maybe.code === 'string' || typeof maybe.code === 'number'
        ? maybe.code
        : (maybe.errno !== undefined ? String(maybe.errno) : undefined);
    }

    if (opts.code !== undefined) this.code = opts.code;
    this.path = opts.path;

    // maintain proper name for instanceof checks
    this.name = this.constructor.name;
  }
}
