import type { CmdResult } from './cmd-result.ts';

export class CmdError<T = void> extends Error {
  readonly result: CmdResult<T>;
  silent: boolean = false;

  constructor(message: string, result: CmdResult<T>) {
    super(message, { cause: result._parseError });
    this.name = 'CmdError';
    this.result = result;
  }

  get stdout(): string {
    return this.result.stdout;
  }

  get stderr(): string {
    return this.result.stderr;
  }

  get exitCode(): number | undefined {
    return this.result.exitCode;
  }
}
