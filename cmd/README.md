# @epdoc/cmd

A fluent, typed wrapper around `Deno.Command` for running external processes. Supports captured output, interactive
mode, stdin piping, timeouts, dry-run testing, and pluggable output/error parsers.

## Installation

```bash
deno add @epdoc/cmd
```

## Usage

### Basic captured execution

```typescript
import { runner } from '@epdoc/cmd';

const result = await runner('git', ['status', '--short']).cwd('/my/repo').run();
if (result.success) {
  console.log(result.stdout);
}
```

### Interactive mode (inherit stdio)

```typescript
await runner('deno', ['publish']).interactive().run();
```

### Throw on failure

```typescript
await runner('git', ['push']).orThrow();
// On failure, throws CmdError with .result containing full output
```

### Stdin piping

```typescript
const result = await runner('sort').stdin('cherry\napple\nbanana').run();
```

### Timeout

```typescript
const result = await runner('sleep', ['60']).timeout(5000).run();
```

### Dry-run / test mode

```typescript
const result = await runner('deno', ['cache', 'mod.ts']).dryRun(ctx.dryRun).run();
```

### Silent errors (suppress stack traces at top level)

```typescript
await runner('git', ['push']).silent().orThrow();
// error.silent === true → framework skips stack trace display
```

### Options object (from higher-level config)

```typescript
function runBuild(opts: CmdOptions) {
  return runner('deno', ['task', 'build'], opts).run();
}
```

### Subclassing for a fixed command

```typescript
import { type Options, Runner } from '@epdoc/cmd';

class DenoRunner extends Runner {
  constructor(args?: string[], opts?: Options) {
    super('deno', args, opts);
  }
}

const result = await new DenoRunner(['cache', 'mod.ts']).run();
```

## Output parsing

`@epdoc/cmd` provides pluggable parsers that transform command output into typed data.

### Pre-baked parsers

| Method                  | Stream                     | Returns                   | Description                         |
| ----------------------- | -------------------------- | ------------------------- | ----------------------------------- |
| `.outAsLines(stream?)`  | stdout (default) or stderr | `string[]`                | Split into trimmed, non-empty lines |
| `.outAsString(stream?)` | stdout (default) or stderr | `string`                  | Return trimmed string               |
| `.outJson(stream?)`     | stdout (default) or stderr | `Record<string, unknown>` | Parse as JSON                       |

```typescript
const lines = await runner('git', ['status', '--porcelain'])
  .outAsLines()
  .orThrow();
// lines: string[] — parsed from stdout

const errLines = await runner('deno', ['add', 'pkg'])
  .outAsLines('stderr')
  .orThrow();
// errLines: string[] — parsed from stderr
```

### Custom outParser

The `outParser` receives the full `ICmdResult` (`stdout`, `stderr`, `command`, `code`) and returns typed data. It can
branch based on exit code:

```typescript
interface AddResult {
  lines: string[];
  version?: string;
}

const data = await runner('deno', ['add', 'pkg'])
  .outParser((result) => {
    if (result.code === 0) {
      return { lines: parseLines(result.stdout) };
    }
    return { lines: parseLines(result.stderr), version: extractVersion(result.stderr) };
  })
  .orThrow();
```

### Reusable parse utilities

The same parsing functions used internally are exported for reuse in custom parsers:

```typescript
import { parseLines, parseTrimmed, parseJson } from '@epdoc/cmd';

// Use in a custom outParser
.outParser((result) => {
  if (result.code === 0) return parseLines(result.stdout);
  return parseLines(result.stderr);
})

// Use standalone
const lines = parseLines('a\n  b\n\nc');  // ['a', 'b', 'c']
const str = parseTrimmed('  hello  ');     // 'hello'
const obj = parseJson('{"x":1}');          // { x: 1 }
```

### Typed error parser (optional)

The `errParser` creates a typed error object on failure. Only needed when you want `orThrow()` to throw a
domain-specific error type:

```typescript
class AddError extends Error {
  constructor(public readonly lines: string[]) {
    super('deno add failed');
  }
}

try {
  await runner('deno', ['add', 'pkg'])
    .outParser((result) => parseLines(result.stderr))
    .errParser((result) => new AddError(parseLines(result.stderr)))
    .orThrow();
} catch (err) {
  if (err instanceof AddError) {
    console.error(err.lines);
  }
}
// Still have result.data from outParser via error.result.data
```

Without `errParser`, `orThrow()` throws a `CmdError` which carries the full `result`:

```typescript
try {
  await runner('deno', ['add', 'pkg']).orThrow();
} catch (err) {
  if (err instanceof CmdError) {
    console.error(err.result.stdout, err.result.stderr);
  }
}
```

### Stream selection

Methods that accept a stream parameter can target stdout, stderr, or both:

```typescript
import { Stream } from '@epdoc/cmd';

// Read from stderr
.outAsLines('stderr')

// Read from stdout (explicit)
.outAsLines('stdout')

// Merge both streams
.outAsLines(['stdout', 'stderr'])

// Using the Stream constant
.outAsLines(Stream.stderr)
```

## API

### `runner<T, E>(command, args?, opts?)`

Returns a `CmdRunner<T, E>` builder instance. `T` is the type of `.data`, `E` is the type of `.error` on the result.

### `CmdRunner<T, E>`

| Method                  | Description                                                            |
| ----------------------- | ---------------------------------------------------------------------- |
| `.cwd(path)`            | Working directory                                                      |
| `.env(vars)`            | Set environment variables                                              |
| `.clearEnv()`           | Clear inherited env, use only `.env()` values                          |
| `.dryRun(bool?)`        | Skip execution, return success                                         |
| `.timeout(ms)`          | Kill process after ms                                                  |
| `.stdin(data)`          | Write string or bytes to process stdin                                 |
| `.interactive(bool?)`   | Inherit stdio (for interactive commands)                               |
| `.signal(abort)`        | Attach AbortSignal                                                     |
| `.uid(n)` / `.gid(n)`   | Unix user/group ID                                                     |
| `.silent(bool?)`        | Set `error.silent = true` on failure (suppress stack trace)            |
| `.outParser(fn)`        | Custom parser: `(result: ICmdResult) => T` — sets `result.data`        |
| `.errParser(fn)`        | Custom error parser: `(result: ICmdResult) => E` — sets `result.error` |
| `.outAsLines(stream?)`  | Pre-baked parser: split output into trimmed lines                      |
| `.outAsString(stream?)` | Pre-baked parser: return trimmed string                                |
| `.outJson(stream?)`     | Pre-baked parser: parse JSON                                           |
| `.options(opts)`        | Merge multiple options at once                                         |
| `.run()`                | Execute, return `CmdResult<T, E>` (never throws)                       |
| `.orThrow()`            | Execute, return `T` on success, throw on failure                       |

### `CmdResult<T, E>`

| Member             | Description                                                                                              |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| `.success`         | Boolean, true if exit code is 0                                                                          |
| `.code`            | Exit code number                                                                                         |
| `.stdout`          | stdout as string                                                                                         |
| `.stderr`          | stderr as string                                                                                         |
| `.stdoutLines`     | stdout split into trimmed lines                                                                          |
| `.stderrLines`     | stderr split into trimmed lines                                                                          |
| `.command`         | Full command string (e.g., "git status")                                                                 |
| `.duration`        | Execution time in ms                                                                                     |
| `.data`            | Typed data from `outParser` (type `T`). `undefined` if no parser set.                                    |
| `.error`           | Error from `errParser` or default `CmdError` on failure (type `E`). Always set when `success === false`. |
| `.dryRun`          | Whether execution was skipped                                                                            |
| `.json<D>()`       | Parse stdout as JSON (no parser required)                                                                |
| `CmdResult.from()` | Static factory for test/mock results                                                                     |
| `CmdResult.ok()`   | Static factory for a successful mock result (no `as` cast needed)                                        |
| `CmdResult.fail()` | Static factory for a failure mock result with optional exit code and stderr                              |

### `CmdRunner` — new testing helpers

| Method / Getter | Description                                                                   |
| --------------- | ----------------------------------------------------------------------------- |
| `.commandArgs`  | Read-only getter for the configured command arguments                         |
| `.toRecord()`   | Snapshot `{ args, opts }` without executing — inspect what would run          |
| `.onRun(fn)`    | Register a callback invoked after every `run()` with `{ args, opts, result }` |

### `CmdError`

| Member                              | Description                        |
| ----------------------------------- | ---------------------------------- |
| `.result`                           | The underlying `CmdResult`         |
| `.stdout` / `.stderr` / `.exitCode` | Shortcuts to result fields         |
| `.silent`                           | Flag for suppressing error logging |

### `ICmdResult`

The context object passed to parsers:

```typescript
interface ICmdResult {
  stdout: string;
  stderr: string;
  command: string;
  code?: number;
}
```

### `Stream` / `StreamTag`

```typescript
const Stream = { stdout: 'stdout', stderr: 'stderr' } as const;
type StreamTag = 'stdout' | 'stderr';
```

## Testing & Mocking

`@epdoc/cmd` provides several hooks to make it easy to test code that runs external commands.

### 1. Inspect what would run without executing

Use `toRecord()` to inspect the runner's command name, args, and opts without executing:

```typescript
const runner = Cmd.runner('git', ['add', '.']).cwd('/repo');
const record = runner.toRecord();
assertEquals(record.command, 'git');
assertEquals(record.args, ['add', '.']);
assertEquals(record.opts.cwd, '/repo');
```

Or access `commandArgs` directly:

```typescript
const runner = Cmd.runner('echo', ['hello']);
assertEquals(runner.commandArgs, ['hello']);
```

### 2. Record commands with `onRun()`

Attach a callback that fires after each `run()` or `orThrow()` call. The callback receives the command name, args, opts,
and result:

```typescript
const recorded: { command: string; args: string[]; opts: Cmd.Options }[] = [];
const runner = Cmd.runner('git', ['status'])
  .cwd('/repo')
  .onRun((record) => recorded.push({ command: record.command, args: record.args, opts: record.opts }));

await runner.dryRun(true).run();
assertEquals(recorded[0].command, 'git');
assertEquals(recorded[0].args, ['status']);
assertEquals(recorded[0].opts.cwd, '/repo');
```

In test mode (dry-run), `onRun` fires with a mock success result. In real execution, it fires with the actual result.
This lets consumers build a central recorder once:

```typescript
class MyTool {
  #recorded: ExecutedCommand[] = [];

  #cmd(args: string[], cwd: string): Cmd.Runner {
    return Cmd.runner('git', args)
      .cwd(cwd)
      .onRun((r) => this.#recorded.push({ command: r.command, args: r.args, opts: r.opts }));
  }

  async add(): Promise<void> {
    // Recording happens automatically via onRun
    await this.#cmd(['add', '.'], '/repo').dryRun(true).run();
  }
}
```

### 3. Create mock results with `Cmd.Result.ok()` / `Cmd.Result.fail()`

Construct mock `CmdResult` instances without type-casting:

```typescript
// Before: requires `as` cast
return new Cmd.Result<T, MyError>({ success: true }) as Cmd.Result<T, MyError>;

// After: clean generic inference
return Cmd.Result.ok<T, MyError>();
return Cmd.Result.fail<T, MyError>(1, 'error output');
```

### 4. Full test pattern for a command wrapper

```typescript
import { type CmdOptions, type Options, Result, runner as cmd } from '@epdoc/cmd';

class GitWrapper {
  #executed: { args: string[]; opts: CmdOptions }[] = [];

  #runner<T>(args: string[], opts?: CmdOptions<T>): Cmd.Runner<T> {
    return cmd<T>('git', args, opts)
      .onRun((r) => this.#executed.push({ args: r.args, opts: r.opts }));
  }

  async add(paths?: string[]): Promise<void> {
    const files = paths ?? ['.'];
    await this.#runner(['add', ...files]).run();
  }

  get executedCommands() {
    return this.#executed;
  }
}

// In tests:
Deno.test('add records command', async () => {
  const git = new GitWrapper();
  // Inject dry-run + onRun via runner
  await git.add(['src/file.ts']);
  assertEquals(git.executedCommands[0].args, ['add', 'src/file.ts']);
});
```

## License

MIT
