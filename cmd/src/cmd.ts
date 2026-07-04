import { CmdError } from './cmd-error.ts';
import { CmdResult } from './cmd-result.ts';
import type { CmdOptions, Milliseconds } from './types.ts';

const encoder = new TextEncoder();

export class CmdRunner<T = void, E extends Error = Error> {
  #cmd: string;
  #args: string[];
  #opts: CmdOptions<T, E>;

  constructor(cmd: string, args?: string[], opts?: CmdOptions<T, E>) {
    this.#cmd = cmd;
    this.#args = args ?? [];
    this.#opts = { ...opts };
  }

  static from<T, E extends Error = Error>(
    cmd: string,
    args?: string[],
    opts?: CmdOptions<T, E>,
  ): CmdRunner<T, E> {
    return new CmdRunner<T, E>(cmd, args, opts);
  }

  cwd(path: string): this {
    this.#opts.cwd = path;
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

  outParser<R>(parser: (data: string) => R): CmdRunner<R, E> {
    this.#opts.outParser = parser as unknown as (data: string) => T;
    return this as unknown as CmdRunner<R, E>;
  }

  errParser<F extends Error>(
    parser: (result: {
      stdout: string;
      stderr: string;
      command: string;
      code?: number;
    }) => F,
  ): CmdRunner<T, F> {
    this.#opts.errParser = parser as unknown as (result: {
      stdout: string;
      stderr: string;
      command: string;
      code?: number;
    }) => E;
    return this as unknown as CmdRunner<T, F>;
  }

  options(opts: Partial<CmdOptions<T, E>>): this {
    Object.assign(this.#opts, opts);
    return this;
  }

  get opts(): CmdOptions<T, E> {
    return { ...this.#opts };
  }

  toString(): string {
    return [this.#cmd, ...this.#args].join(' ');
  }

  async run(): Promise<CmdResult<T, E>> {
    const result = CmdResult.from<T, E>(this.#cmd, this.#args, this.#opts);
    result._outParser = this.#opts.outParser;
    result._errParser = this.#opts.errParser;

    if (this.#opts.dryRun) {
      result.dryRun = true;
      return result.asSuccess();
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

    try {
      if (interactive) {
        return await this.#runInteractive(result, denoOpts);
      } else {
        return await this.#runCaptured(result, denoOpts);
      }
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  async orThrow(): Promise<T> {
    const result = await this.run();
    if (result.error) {
      throw result.error;
    }
    if (!result.success) {
      throw new CmdError(
        `Command failed: ${result.command} (exit code: ${result.code})`,
        result as CmdResult,
      );
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

  async #runInteractive(
    result: CmdResult<T, E>,
    denoOpts: Deno.CommandOptions,
  ): Promise<CmdResult<T, E>> {
    if (this.#opts.outParser || this.#opts.errParser) {
      throw new CmdError(
        'Parsers cannot be used in interactive mode; stdout and stderr are not captured',
        result as CmdResult,
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

  async #runCaptured(
    result: CmdResult<T, E>,
    denoOpts: Deno.CommandOptions,
  ): Promise<CmdResult<T, E>> {
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

export function run<T, E extends Error = Error>(
  command: string,
  args?: string[],
  opts?: CmdOptions<T, E>,
): CmdRunner<T, E> {
  return new CmdRunner<T, E>(command, args, opts);
}
