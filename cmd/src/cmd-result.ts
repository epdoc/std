import type { CmdOptions, Milliseconds } from './types.ts';

const decoder = new TextDecoder();
const encoder = new TextEncoder();

export class CmdResult<T = void, E extends Error = Error> {
  #t0 = performance.now();
  success: boolean = false;
  code?: number;
  /** A string that can be used in UI that show the command that was run */
  command: string = '';
  duration: Milliseconds = 0;
  _stdout?: Uint8Array;
  _stderr?: Uint8Array;
  _outParser?: (data: string) => T;
  _errParser?: (result: {
    stdout: string;
    stderr: string;
    command: string;
    code?: number;
  }) => E;
  data?: T;
  /** Indicates this was a dry run */
  dryRun?: boolean;
  error?: E;

  constructor(
    init?: Partial<
      Omit<CmdResult<T, E>, 'stdout' | 'stderr' | 'lines' | 'stdoutLines' | 'stderrLines' | 'stdoutRaw' | 'stderrRaw'>
    >,
  ) {
    if (init) {
      this.success = init.success ?? false;
      this.code = init.code;
      this.command = init.command ?? '';
      this.duration = init.duration ?? 0;
      this._stdout = init._stdout;
      this._stderr = init._stderr;
      this.data = init.data;
      this.dryRun = init.dryRun;
      this.error = init.error as E | undefined;
    }
  }

  static from<T = void, E extends Error = Error>(
    cmd: string,
    args: string[],
    opts?: CmdOptions<T, E>,
  ): CmdResult<T, E> {
    const result = new CmdResult<T, E>();
    result.command = [cmd, ...args].join(' ');
    result.dryRun = !!opts?.dryRun;
    return result;
  }

  asSuccess(): this {
    this.success = true;
    this.duration = performance.now() - this.#t0;
    return this;
  }

  setCode(code: number): this {
    this.code = code;
    this.success = code === 0;
    this.duration = performance.now() - this.#t0;
    return this;
  }

  setStdout(value: Uint8Array | string): this {
    this._stdout = typeof value === 'string' ? encoder.encode(value) : value;
    return this;
  }

  setStderr(value: Uint8Array | string): this {
    this._stderr = typeof value === 'string' ? encoder.encode(value) : value;
    return this;
  }

  applyParsers(): this {
    if (this._outParser && this._stdout && this._stdout.length > 0) {
      this.data = this._outParser(decoder.decode(this._stdout));
    }
    if (this._errParser && this._stderr && this._stderr.length > 0) {
      this.error = this._errParser({
        stdout: this.stdout,
        stderr: this.stderr,
        command: this.command,
        code: this.code,
      });
    }
    return this;
  }

  get stdout(): string {
    if (!this._stdout) return '';
    return decoder.decode(this._stdout);
  }

  get stderr(): string {
    if (!this._stderr) return '';
    return decoder.decode(this._stderr);
  }

  get stdoutRaw(): Uint8Array | undefined {
    return this._stdout;
  }

  get stderrRaw(): Uint8Array | undefined {
    return this._stderr;
  }

  get stdoutLines(): string[] {
    const cleaned = this.stdout.trim();
    if (!cleaned) return [];
    return cleaned.split(/\r?\n/).map((line) => line.trim());
  }

  get stderrLines(): string[] {
    const cleaned = this.stderr.trim();
    if (!cleaned) return [];
    return cleaned.split(/\r?\n/).map((line) => line.trim());
  }

  json<D>(): D {
    return JSON.parse(this.stdout) as D;
  }
}
