import type { CmdError } from './cmd-error.ts';
import type { CmdOptions, ICmdResult, Milliseconds } from './types.ts';
import { getExitCodeDescription } from './codes.ts';

const decoder = new TextDecoder();
const encoder = new TextEncoder();

export class CmdResult<T = void> implements ICmdResult {
  #t0 = performance.now();
  success: boolean = false;
  exitCode?: number;
  /** A string that can be used in UI that show the command that was run */
  command: string = '';
  duration: Milliseconds = 0;
  _stdout?: Uint8Array;
  _stderr?: Uint8Array;
  _outParser?: (result: ICmdResult) => T;
  _errParser?: (result: ICmdResult) => Error;
  _parseError?: Error;
  data?: T;
  /** Indicates this was a dry run */
  dryRun?: boolean;
  error?: CmdError<T>;

  constructor(
    init?: Partial<
      Omit<CmdResult<T>, 'stdout' | 'stderr' | 'lines' | 'stdoutLines' | 'stderrLines' | 'stdoutRaw' | 'stderrRaw'>
    >,
  ) {
    if (init) {
      this.success = init.success ?? false;
      this.exitCode = init.exitCode;
      this.command = init.command ?? '';
      this.duration = init.duration ?? 0;
      this._stdout = init._stdout;
      this._stderr = init._stderr;
      this.data = init.data;
      this.dryRun = init.dryRun;
      this.error = init.error;
      this._parseError = init._parseError;
    }
  }

  static from<T = void>(cmd: string, args: string[], opts?: CmdOptions<T>): CmdResult<T> {
    const result = new CmdResult<T>();
    result.command = [cmd, ...args].join(' ');
    result.dryRun = !!opts?.dryRun;
    return result;
  }

  /**
   * Create a successful mock result for testing.
   * Generic types are inferred from the return type expression, avoiding `as` casts.
   * @example Cmd.Result.ok<MyData>(parsedData);
   */
  static ok<T = void>(data?: T): CmdResult<T> {
    const result = new CmdResult<T>();
    result.success = true;
    result.data = data;
    return result;
  }

  /**
   * Create a failure mock result for testing.
   * @param code - Simulated exit code (default: undefined, meaning no exit)
   * @param stderr - Simulated stderr output
   */
  static fail<T = void>(exitCode?: number, stderr?: string): CmdResult<T> {
    const result = new CmdResult<T>();
    if (exitCode !== undefined) {
      result.exitCode = exitCode;
    }
    if (stderr !== undefined) {
      result._stderr = encoder.encode(stderr);
    }
    return result;
  }

  asSuccess(): this {
    this.success = true;
    this.duration = performance.now() - this.#t0;
    return this;
  }

  setExitCode(code: number): this {
    this.exitCode = code;
    this.success = code === 0;
    this.duration = performance.now() - this.#t0;
    return this;
  }

  get exitDescription(): string | undefined {
    return this.exitCode !== undefined ? getExitCodeDescription(this.exitCode) : undefined;
  }

  get err(): CmdError<T> {
    if (!this.error) throw new Error('CmdResult.error is not set');
    return this.error;
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
    if (this._outParser) {
      this.data = this._outParser(this);
    }
    if (this._errParser && this._stderr && this._stderr.length > 0) {
      this._parseError = this._errParser(this);
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
