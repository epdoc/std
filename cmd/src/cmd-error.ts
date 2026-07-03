import type { CmdResult } from './cmd-result.ts';

export class CmdError extends Error {
  readonly result: CmdResult;
  silent: boolean = false;

  constructor(message: string, result: CmdResult) {
    super(message);
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
    return this.result.code;
  }
}
