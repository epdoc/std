# @epdoc/cmd

A fluent, typed wrapper around `Deno.Command` for running external processes. Supports captured output, interactive
mode, stdin piping, timeouts, and dry-run testing.

## Installation

```bash
deno add @epdoc/cmd
```

## Usage

### Basic captured execution

```typescript
import { cmd } from '@epdoc/cmd';

const result = await cmd('git', ['status', '--short']).cwd('/my/repo').run();
if (result.success) {
  console.log(result.stdout);
}
```

### Interactive mode (inherit stdio)

```typescript
await cmd('deno', ['publish']).interactive().run();
```

### Throw on failure

```typescript
const result = await cmd('git', ['push']).orThrow();
```

### Stdin piping

```typescript
const result = await cmd('sort').stdin('cherry\napple\nbanana').run();
```

### Timeout

```typescript
const result = await cmd('sleep', ['60']).timeout(5000).run();
```

### Dry-run / test mode

```typescript
const result = await cmd('deno', ['cache', 'mod.ts']).dryRun(ctx.dryRun).run();
```

### Parsing JSON output

```typescript
const data = (await cmd('exiftool', ['-j', 'photo.jpg']).run()).json<Metadata[]>();
```

### Options object (from higher-level config)

```typescript
function runBuild(opts: CmdOptions) {
  return cmd('deno', ['task', 'build'], opts).run();
}
```

### Subclassing for a fixed command

```typescript
import { Cmd, type CmdOptions } from '@epdoc/cmd';

class DenoCmd<T, E> extends Cmd<T, E> {
  constructor(args?: string[], opts?: CmdOptions) {
    super('deno', args, opts);
  }
}
```

## API

### `cmd(command, args?, opts?)`

Returns a `Cmd` builder instance.

### `Cmd` builder methods

| Method                | Description                                   |
| --------------------- | --------------------------------------------- |
| `.cwd(path)`          | Working directory                             |
| `.env(vars)`          | Set environment variables                     |
| `.clearEnv()`         | Clear inherited env, use only `.env()` values |
| `.dryRun(bool?)`      | Skip execution, return success                |
| `.timeout(ms)`        | Kill process after ms                         |
| `.stdin(data)`        | Write string or bytes to process stdin        |
| `.interactive(bool?)` | Inherit stdio (for interactive commands)      |
| `.signal(abort)`      | Attach AbortSignal                            |
| `.uid(n)` / `.gid(n)` | Unix user/group ID                            |
| `.options(opts)`      | Merge multiple options at once                |
| `.run()`              | Execute, return `CmdResult` (never throws)    |
| `.orThrow()`          | Execute, throw `CmdError` on failure          |

### `CmdResult<T, E>`

| Member             | Description                              |
| ------------------ | ---------------------------------------- |
| `.success`         | Boolean, true if exit code is 0          |
| `.code`            | Exit code number                         |
| `.stdout`          | stdout as string                         |
| `.stderr`          | stderr as string                         |
| `.stdoutLines`     | stdout split into trimmed lines          |
| `.stderrLines`     | stderr split into trimmed lines          |
| `.command`         | Full command string (e.g., "git status") |
| `.duration`        | Execution time in ms                     |
| `.data`            | Optional typed data payload              |
| `.error`           | Optional error on failure                |
| `.dryRun`          | Whether execution was skipped            |
| `.json<D>()`       | Parse stdout as JSON                     |
| `CmdResult.from()` | Static factory for test/mock results     |

### `CmdError`

| Member                              | Description                        |
| ----------------------------------- | ---------------------------------- |
| `.result`                           | The underlying `CmdResult`         |
| `.stdout` / `.stderr` / `.exitCode` | Shortcuts to result fields         |
| `.silent`                           | Flag for suppressing error logging |

## License

MIT
