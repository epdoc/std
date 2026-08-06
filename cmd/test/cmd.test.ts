import { assert, assertEquals, assertInstanceOf, assertRejects } from '@std/assert';
import * as Cmd from '../src/mod.ts';

Deno.test('cmd - basic command execution', async () => {
  const result = await Cmd.runner('echo', ['hello world']).run();
  assertEquals(result.success, true);
  assertEquals(result.exitCode, 0);
  assertEquals(result.stdout.trim(), 'hello world');
});

Deno.test('cmd - fluent builder', async () => {
  const result = await Cmd.runner('echo', ['test'])
    .cwd('/')
    .dryRun(false)
    .run();
  assertEquals(result.success, true);
});

Deno.test('cmd - dry run returns success without executing', async () => {
  const result = await Cmd.runner('this-command-does-not-exist-12345', ['foo'])
    .dryRun(true)
    .run();
  assertEquals(result.success, true);
  assertEquals(result.dryRun, true);
});

Deno.test('cmd - non-zero exit code', async () => {
  const result = await Cmd.runner('deno', ['eval', 'Deno.exit(42)']).run();
  assertEquals(result.success, false);
  assertEquals(result.exitCode, 42);
});

Deno.test('cmd - orThrow returns parsed data', async () => {
  const data = await Cmd.runner('echo', ['{"msg":"hello"}'])
    .outParser((s) => JSON.parse(s.stdout) as { msg: string })
    .orThrow();
  assertEquals(data.msg, 'hello');
});

Deno.test('cmd - orThrow throws on failure', async () => {
  await assertRejects(
    () => Cmd.runner('deno', ['eval', 'Deno.exit(1)']).orThrow(),
    Cmd.Error,
  );
});

Deno.test('cmd - Cmd.Error properties', async () => {
  try {
    await Cmd.runner('deno', ['eval', 'Deno.exit(2)']).orThrow();
  } catch (err) {
    assertInstanceOf(err, Cmd.Error);
    assertEquals(err.exitCode, 2);
    assert(err.message.includes('(exit 2:'));
    assertInstanceOf(err.result, Cmd.Result);
  }
});

Deno.test('cmd - stdin pipe', async () => {
  const result = await Cmd.runner('deno', [
    'eval',
    `
    const reader = Deno.stdin.readable.getReader();
    const { value } = await reader.read();
    console.log(new TextDecoder().decode(value));
  `,
  ]).stdin('hello from stdin').run();
  assertEquals(result.success, true);
  assertEquals(result.stdout.trim(), 'hello from stdin');
});

Deno.test('cmd - timeout kills long-running command', async () => {
  const result = await Cmd.runner('deno', ['eval', 'await new Promise(r => setTimeout(r, 50000))'])
    .timeout(100)
    .run();
  assertEquals(result.success, false);
  assert(result.exitCode !== 0 || result.exitCode === undefined);
});

Deno.test('cmd - environment variables', async () => {
  const result = await Cmd.runner('deno', ['eval', 'console.log(Deno.env.get("MY_VAR"))'])
    .env({ MY_VAR: 'custom_value' })
    .run();
  assertEquals(result.stdout.trim(), 'custom_value');
});

Deno.test('cmd - Cmd.Result.json parses stdout', async () => {
  const result = await Cmd.runner('echo', ['{"a":1,"b":"two"}']).run();
  const data = result.json<{ a: number; b: string }>();
  assertEquals(data.a, 1);
  assertEquals(data.b, 'two');
});

Deno.test('cmd - Cmd.Result.stdoutLines', async () => {
  const result = await Cmd.runner('echo', ['line1\nline2\nline3']).run();
  const lines = result.stdoutAsLines;
  assertEquals(lines.length, 3);
  assertEquals(lines[0], 'line1');
});

Deno.test('cmd - options object merges with fluent methods', async () => {
  const result = await Cmd.runner('echo', ['opts'])
    .options({ cwd: '/', dryRun: false })
    .run();
  assertEquals(result.success, true);
});

Deno.test('cmd - constructor options work', async () => {
  const instance = new Cmd.Runner('echo', ['ctor'], { dryRun: true });
  assertEquals(instance.opts.dryRun, true);
  const result = await instance.run();
  assertEquals(result.success, true);
  assertEquals(result.dryRun, true);
});

Deno.test('cmd - Cmd.Result.from for test mode', () => {
  const result = Cmd.Result.from('git', ['status']);
  assertEquals(result.success, false);
  assertEquals(result.command, 'git status');
  result.asSuccess();
  assertEquals(result.success, true);
});

Deno.test('Cmd - subclassable (DenoCmd pattern)', async () => {
  class DenoCmd extends Cmd.Runner {
    constructor(args?: string[], opts?: Cmd.Options) {
      super('deno', args, opts);
    }
  }

  const instance = new DenoCmd(['eval', 'console.log("subclass")']);
  const result = await instance.dryRun(false).run();
  assertEquals(result.success, true);
  assertEquals(result.stdout.trim(), 'subclass');
});

Deno.test('cmd - uid/gid passthrough (no-op test)', () => {
  const instance = Cmd.runner('echo', ['test']).uid(1000).gid(1000);
  const opts = instance.opts;
  assertEquals(opts.uid, 1000);
  assertEquals(opts.gid, 1000);
});

Deno.test('cmd - env merge preserves existing', () => {
  const instance = Cmd.runner('echo', ['env-test'])
    .env({ VAR1: 'one' })
    .env({ VAR2: 'two' });
  const opts = instance.opts;
  assertEquals(opts.env?.VAR1, 'one');
  assertEquals(opts.env?.VAR2, 'two');
});

Deno.test('cmd - orThrow without parser returns void', async () => {
  const data = await Cmd.runner('echo', ['success']).orThrow();
  assertEquals(data, undefined);
});

Deno.test('cmd - stderr captured on failure', async () => {
  const result = await Cmd.runner('deno', ['eval', 'console.error("err msg"); Deno.exit(1)']).run();
  assertEquals(result.success, false);
  assert(result.stderr.includes('err msg') || result.stderr.length > 0);
});

Deno.test('cmd - error set on failure by default', async () => {
  const result = await Cmd.runner('deno', ['eval', 'Deno.exit(1)']).run();
  assertEquals(result.success, false);
  assert(result.error instanceof Cmd.Error);
  assertEquals(result.error?.exitCode, 1);
  assert(result.error?.message.includes('(exit 1:'));
});

Deno.test('cmd - silent sets error.silent property', async () => {
  const result = await Cmd.runner('deno', ['eval', 'Deno.exit(1)'])
    .silent()
    .run();
  assertEquals(result.success, false);
  assert(result.error instanceof Cmd.Error);
  assertEquals((result.error as Cmd.Error).silent, true);
});

Deno.test('cmd - silent(false) leaves silent as false', async () => {
  const result = await Cmd.runner('deno', ['eval', 'Deno.exit(1)'])
    .silent(false)
    .run();
  assertEquals(result.success, false);
  assert(result.error instanceof Cmd.Error);
  assertEquals((result.error as Cmd.Error).silent, false);
});

Deno.test('cmd - outParser parses stdout into data', async () => {
  const result = await Cmd.runner('echo', ['{"a":1,"b":"two"}'])
    .outParser((result) => JSON.parse(result.stdout) as { a: number; b: string })
    .run();
  assertEquals(result.data?.a, 1);
  assertEquals(result.data?.b, 'two');
  assertEquals(result.success, true);
});

Deno.test('cmd - errParser parses stderr into error', async () => {
  class ParseError extends Error {
    constructor(readonly parsed: Record<string, unknown>) {
      super('parsed stderr error');
      this.name = 'ParseError';
    }
  }
  const result = await Cmd.runner('deno', [
    'eval',
    'console.error(JSON.stringify({errCode: 99})); Deno.exit(1)',
  ])
    .errParser((result) => new ParseError(JSON.parse(result.stderr) as Record<string, unknown>))
    .run();
  assertEquals(result.success, false);
  assert(result.error instanceof Cmd.Error);
  assert(result.error?.cause instanceof ParseError);
  assertEquals((result.error?.cause as ParseError).parsed.errCode, 99);
});

Deno.test('cmd - orThrow returns parsed data on success', async () => {
  const data = await Cmd.runner('echo', ['{"value":42}'])
    .outParser((result) => JSON.parse(result.stdout) as { value: number })
    .orThrow();
  assertEquals(data.value, 42);
});

Deno.test('cmd - orThrow throws parsed error on failure', async () => {
  class CliError extends Error {
    constructor(readonly code: number) {
      super('CLI error');
      this.name = 'CliError';
    }
  }
  let thrown: unknown;
  await assertRejects(
    () =>
      Cmd.runner('deno', ['eval', 'console.error(JSON.stringify({code: 99})); Deno.exit(1)'])
        .errParser((result) => new CliError((JSON.parse(result.stderr) as { code: number }).code))
        .orThrow(),
    Cmd.Error,
  );
  try {
    await Cmd.runner('deno', ['eval', 'console.error(JSON.stringify({code: 99})); Deno.exit(1)'])
      .errParser((result) => new CliError((JSON.parse(result.stderr) as { code: number }).code))
      .orThrow();
  } catch (err) {
    thrown = err;
  }
  assert(thrown instanceof Cmd.Error);
  assert(thrown.cause instanceof CliError);
  assertEquals((thrown.cause as CliError).code, 99);
});

Deno.test('cmd - interactive mode with parser throws', async () => {
  await assertRejects(
    () =>
      Cmd.runner('echo', ['test'])
        .interactive(true)
        .outParser((result) => result.stdout.trim())
        .run(),
    Cmd.Error,
  );
});

Deno.test('cmd - applyParsers runs even when stdout empty', () => {
  const result = new Cmd.Result<string>();
  result._outParser = (s) => s.stdout.toUpperCase();
  result.applyParsers();
  assertEquals(result.data, '');
});

Deno.test('cmd - outAsLines splits stdout into trimmed lines', async () => {
  const result = await Cmd.runner('echo', ['line1\n  line2\n\nline3'])
    .outAsLines()
    .run();
  assertEquals(result.data, ['line1', 'line2', 'line3']);
});

Deno.test('cmd - outAsString returns trimmed stdout', async () => {
  const result = await Cmd.runner('echo', ['  hello world  '])
    .outAsString()
    .run();
  assertEquals(result.data, 'hello world');
});

Deno.test('cmd - outAsString with orThrow', async () => {
  const data = await Cmd.runner('echo', ['hello'])
    .outAsString()
    .orThrow();
  assertEquals(data, 'hello');
});

Deno.test('cmd - outJson parses stdout as JSON', async () => {
  const result = await Cmd.runner('echo', ['{"a":1,"b":"two"}'])
    .outJson()
    .run();
  assertEquals(result.data?.a, 1);
  assertEquals(result.data?.b, 'two');
});

Deno.test('cmd - outJson with orThrow', async () => {
  const data = await Cmd.runner('echo', ['{"value":42}'])
    .outJson()
    .orThrow();
  assertEquals(data.value, 42);
});

Deno.test('cmd - outAsLines with explicit stdout stream', async () => {
  const result = await Cmd.runner('echo', ['a\nb'])
    .outAsLines('stdout')
    .run();
  assertEquals(result.data, ['a', 'b']);
});

Deno.test('cmd - outAsLines reads stderr', async () => {
  const result = await Cmd.runner('deno', [
    'eval',
    'console.error("err1\\nerr2"); Deno.exit(1)',
  ])
    .outAsLines('stderr')
    .run();
  assertEquals(result.data, ['err1', 'err2']);
});

Deno.test('cmd - outAsLines merges multiple streams', async () => {
  const result = await Cmd.runner('deno', [
    'eval',
    'console.log("out"); console.error("err"); Deno.exit(1)',
  ])
    .outAsLines(['stdout', 'stderr'])
    .run();
  assert(result.data!.includes('out'));
  assert(result.data!.includes('err'));
});

Deno.test('cmd - outAsString reads stderr', async () => {
  const result = await Cmd.runner('deno', [
    'eval',
    'console.error("  hello from err  "); Deno.exit(1)',
  ])
    .outAsString('stderr')
    .run();
  assertEquals(result.data, 'hello from err');
});

Deno.test('cmd - outJson reads stderr', async () => {
  const result = await Cmd.runner('deno', [
    'eval',
    'console.error(JSON.stringify({x: 1})); Deno.exit(1)',
  ])
    .outJson('stderr')
    .run();
  assertEquals(result.data?.x, 1);
});

Deno.test('cmd - Cmd.Result.ok creates success mock', () => {
  const result = Cmd.Result.ok<string>();
  assertEquals(result.success, true);
  assertEquals(result.exitCode, undefined);
});

Deno.test('cmd - Cmd.Result.ok with data', () => {
  const result = Cmd.Result.ok<string>('hello');
  assertEquals(result.success, true);
  assertEquals(result.data, 'hello');
});

Deno.test('cmd - Cmd.Result.fail creates failure mock', () => {
  const result = Cmd.Result.fail(1, 'error msg');
  assertEquals(result.success, false);
  assertEquals(result.exitCode, 1);
  assertEquals(result.stderr, 'error msg');
});

Deno.test('cmd - Runner.commandArgs returns readonly args', () => {
  const runner = Cmd.runner('echo', ['a', 'b']);
  assertEquals(runner.commandArgs, ['a', 'b']);
});

Deno.test('cmd - Runner.toRecord snapshots command, args and opts', () => {
  const runner = Cmd.runner('git', ['status']).cwd('/repo');
  const record = runner.toRecord();
  assertEquals(record.command, 'git');
  assertEquals(record.args, ['status']);
  assertEquals(record.opts.cwd, '/repo');
});

Deno.test('cmd - Runner.onRun fires on dry-run', async () => {
  const recorded: { command: string; args: string[]; opts: Cmd.Options }[] = [];
  await Cmd.runner('echo', ['hello'])
    .onRun((r) => recorded.push({ command: r.command, args: r.args, opts: r.opts }))
    .dryRun(true)
    .run();
  assertEquals(recorded.length, 1);
  assertEquals(recorded[0].args, ['hello']);
  assertEquals(recorded[0].command, 'echo');
});

Deno.test('cmd - Runner.onRun fires on real execution', async () => {
  const recorded: Cmd.Result<unknown>[] = [];
  await Cmd.runner('echo', ['hello'])
    .onRun((r) => recorded.push(r.result))
    .run();
  assertEquals(recorded.length, 1);
  assert(recorded[0].success);
});
