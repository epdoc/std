import { _ } from '@epdoc/type';
import { CmdError } from './cmd-error.ts';
import { CmdResult } from './cmd-result.ts';
import { parseLines } from './parse.ts';
import { type CmdOptions, type ICmdResult, type Milliseconds, Stream, type StreamTag } from './types.ts';

const encoder = new TextEncoder();

export class CmdRunner<T = void> {
  #cmd: string;
  #args: string[] = [];
  #opts: CmdOptions<T>;
  #onRun?: (record: { command: string; args: string[]; opts: CmdOptions; result: CmdResult<T> }) => void;

  constructor(cmd: string, args?: string | string[], opts?: CmdOptions<T>) {
    this.#cmd = cmd;
    this.#args = args ? (Array.isArray(args) ? args : [args]) : [];
    this.#opts = { ...opts };
  }

  static from<T>(cmd: string, args?: string | string[], opts?: CmdOptions<T>): CmdRunner<T> {
    return new CmdRunner<T>(cmd, args, opts);
  }

  cwd(path: string): this {
    this.#opts.cwd = path;
    return this;
  }

  args(args: string | string[]): this {
    this.#args = this.#args.concat(args);
    return this;
  }

  env(vars: Record<string, string>): this {
    this.#opts.env = { ...this.#opts.env, ...vars };
    return this;
  }

  clearEnv(value?: boolean): this {
    this.#opts.clearEnv = value ?? true;
    return this;
  }

  dryRun(value?: boolean): this {
    this.#opts.dryRun = !!value;
    return this;
  }

  timeout(ms: Milliseconds): this {
    this.#opts.timeout = ms;
    return this;
  }

  stdin(value: string | Uint8Array): this {
    this.#opts.stdin = value;
    return this;
  }

  interactive(value: boolean = true): this {
    this.#opts.interactive = !!value;
    return this;
  }

  signal(abortSignal: AbortSignal): this {
    this.#opts.signal = abortSignal;
    return this;
  }

  uid(value: number): this {
    this.#opts.uid = value;
    return this;
  }

  gid(value: number): this {
    this.#opts.gid = value;
    return this;
  }

  silent(value: boolean = true): this {
    this.#opts.silent = value;
    return this;
  }

  outParser<R>(parser: (data: ICmdResult) => R): CmdRunner<R> {
    this.#opts.outParser = parser as unknown as (data: ICmdResult) => T;
    return this as unknown as CmdRunner<R>;
  }

  errParser(parser: (result: ICmdResult) => Error): CmdRunner<T> {
    this.#opts.errParser = parser;
    return this;
  }

  outAsLines(streams: StreamTag | StreamTag[] = Stream.stdout): CmdRunner<string[]> {
    const stms = _.isArray(streams) ? streams : [streams];
    this.#opts.outParser = ((res: ICmdResult) => {
      const result: string[] = [];
      for (const stm of stms) {
        result.push(...parseLines(res[stm]));
      }
      return result;
    }) as unknown as (res: ICmdResult) => T;
    return this as unknown as CmdRunner<string[]>;
  }

  outAsString(streams: StreamTag | StreamTag[] = Stream.stdout): CmdRunner<string> {
    const stms = _.isArray(streams) ? streams : [streams];
    this.#opts.outParser = ((res: ICmdResult) => {
      let result: string = '';
      for (const stm of stms) {
        result += res[stm].trim();
      }
      return result;
    }) as unknown as (res: ICmdResult) => T;
    return this as unknown as CmdRunner<string>;
  }

  outJson(stm: StreamTag = Stream.stdout): CmdRunner<Record<string, unknown>> {
    this.#opts.outParser = ((res: ICmdResult) => JSON.parse(res[stm])) as unknown as (res: ICmdResult) => T;
    return this as unknown as CmdRunner<Record<string, unknown>>;
  }

  options(opts: Partial<CmdOptions<T>>): this {
    Object.assign(this.#opts, opts);
    return this;
  }

  get opts(): CmdOptions<T> {
    return { ...this.#opts };
  }

  /** Testing helper: read-only access to the configured command arguments. */
  get commandArgs(): readonly string[] {
    return this.#args;
  }

  /**
   * Testing helper: snapshot the current args, command name, and opts without executing.
   * Useful for asserting what a runner WOULD run in a test.
   */
  toRecord(): { command: string; args: string[]; opts: CmdOptions } {
    return { command: this.#cmd, args: [...this.#args], opts: { ...this.#opts } };
  }

  /**
   * Testing helper: register a callback invoked after each `run()` or `orThrow()` call.
   * Receives the command name, args, opts, and result — letting tests record every invocation.
   *
   * In dry-run mode, `result` is a mock success; in real execution it carries the actual output.
   */
  onRun(fn: (record: { command: string; args: string[]; opts: CmdOptions; result: CmdResult<T> }) => void): this {
    this.#onRun = fn;
    return this;
  }

  toString(): string {
    return [this.#cmd, ...this.#args].join(' ');
  }

  async run(): Promise<CmdResult<T>> {
    const result = CmdResult.from<T>(this.#cmd, this.#args, this.#opts);
    result._outParser = this.#opts.outParser;
    result._errParser = this.#opts.errParser;

    if (this.#opts.dryRun) {
      result.dryRun = true;
      const success = result.asSuccess();
      this.#onRun?.({ command: this.#cmd, args: [...this.#args], opts: { ...this.#opts }, result: success });
      return success;
    }

    const cwd = this.#opts.cwd ?? Deno.cwd();
    const interactive = this.#opts.interactive ?? false;

    const denoOpts: Deno.CommandOptions = {
      args: this.#args,
      cwd,
    };

    if (this.#opts.env !== undefined) {
      denoOpts.env = this.#opts.env;
    }
    if (this.#opts.clearEnv !== undefined) {
      denoOpts.clearEnv = this.#opts.clearEnv;
    }
    if (this.#opts.uid !== undefined) {
      denoOpts.uid = this.#opts.uid;
    }
    if (this.#opts.gid !== undefined) {
      denoOpts.gid = this.#opts.gid;
    }

    let timeoutSignal: AbortSignal | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (this.#opts.timeout !== undefined) {
      const controller = new AbortController();
      timeoutSignal = controller.signal;
      timeoutId = setTimeout(() =>
        controller.abort(
          new DOMException(`Command timed out after ${this.#opts.timeout}ms`, 'TimeoutError'),
        ), this.#opts.timeout);
    }

    const combinedSignal = this.#combineSignals(timeoutSignal, this.#opts.signal);
    if (combinedSignal) {
      denoOpts.signal = combinedSignal;
    }

    let cmdResult: CmdResult<T>;
    try {
      if (interactive) {
        cmdResult = await this.#runInteractive(result, denoOpts);
      } else {
        cmdResult = await this.#runCaptured(result, denoOpts);
      }
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }

    if (!cmdResult.success) {
      const msg = cmdResult._parseError
        ? `Command failed: ${cmdResult.command} (exit code: ${cmdResult.code}) ${cmdResult._parseError.message}`
        : `Command failed: ${cmdResult.command} (exit code: ${cmdResult.code})`;
      const err = new CmdError(msg, cmdResult);
      err.silent = this.#opts.silent ?? false;
      cmdResult.error = err;
    }

    this.#onRun?.({ command: this.#cmd, args: [...this.#args], opts: { ...this.#opts }, result: cmdResult });

    return cmdResult;
  }

  async orThrow(): Promise<T> {
    const result = await this.run();
    if (!result.success) {
      throw result.error!;
    }
    return result.data as T;
  }

  #combineSignals(...signals: (AbortSignal | undefined)[]): AbortSignal | undefined {
    const active = signals.filter((s): s is AbortSignal => s !== undefined);
    if (active.length === 0) return undefined;
    if (active.length === 1) return active[0];

    const controller = new AbortController();
    for (const signal of active) {
      if (signal.aborted) {
        controller.abort(signal.reason);
        return controller.signal;
      }
      signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true });
    }
    return controller.signal;
  }

  async #runInteractive(result: CmdResult<T>, denoOpts: Deno.CommandOptions): Promise<CmdResult<T>> {
    if (this.#opts.outParser || this.#opts.errParser) {
      throw new CmdError(
        'Parsers cannot be used in interactive mode; stdout and stderr are not captured',
        result,
      );
    }
    const command = new Deno.Command(this.#cmd, {
      ...denoOpts,
      stdin: 'inherit',
      stdout: 'inherit',
      stderr: 'inherit',
    });

    const child = command.spawn();

    const sigintHandler = () => {
      try {
        child.kill('SIGINT');
      } catch {
        // Process may already be dead
      }
    };
    Deno.addSignalListener('SIGINT', sigintHandler);

    try {
      const { code } = await child.output();
      return result.setCode(code);
    } finally {
      Deno.removeSignalListener('SIGINT', sigintHandler);
    }
  }

  async #runCaptured(result: CmdResult<T>, denoOpts: Deno.CommandOptions): Promise<CmdResult<T>> {
    const stdin = this.#opts.stdin;

    if (stdin !== undefined) {
      denoOpts.stdin = 'piped';
    } else {
      denoOpts.stdin = 'null';
    }

    const command = new Deno.Command(this.#cmd, {
      ...denoOpts,
      stdout: 'piped',
      stderr: 'piped',
    });

    if (stdin !== undefined) {
      const child = command.spawn();
      const writer = child.stdin.getWriter();
      try {
        const data = typeof stdin === 'string' ? encoder.encode(stdin) : stdin;
        await writer.write(data);
      } finally {
        await writer.close();
      }
      const { code, stdout, stderr } = await child.output();
      return result.setCode(code).setStdout(stdout).setStderr(stderr).applyParsers();
    } else {
      const { code, stdout, stderr } = await command.output();
      return result.setCode(code).setStdout(stdout).setStderr(stderr).applyParsers();
    }
  }
}

export function run<T>(command: string, args?: string | string[], opts?: CmdOptions<T>): CmdRunner<T> {
  return new CmdRunner<T>(command, args, opts);
}
