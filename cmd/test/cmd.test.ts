import { assert, assertEquals, assertInstanceOf, assertRejects } from '@std/assert';
import { Cmd, cmd, CmdError, CmdResult } from '../src/mod.ts';
import type { CmdOptions } from '../src/mod.ts';

Deno.test('cmd - basic command execution', async () => {
  const result = await cmd('echo', ['hello world']).run();
  assertEquals(result.success, true);
  assertEquals(result.code, 0);
  assertEquals(result.stdout.trim(), 'hello world');
});

Deno.test('cmd - fluent builder', async () => {
  const result = await cmd('echo', ['test'])
    .cwd('/')
    .dryRun(false)
    .run();
  assertEquals(result.success, true);
});

Deno.test('cmd - dry run returns success without executing', async () => {
  const result = await cmd('this-command-does-not-exist-12345', ['foo'])
    .dryRun(true)
    .run();
  assertEquals(result.success, true);
  assertEquals(result.dryRun, true);
});

Deno.test('cmd - non-zero exit code', async () => {
  const result = await cmd('deno', ['eval', 'Deno.exit(42)']).run();
  assertEquals(result.success, false);
  assertEquals(result.code, 42);
});

Deno.test('cmd - orThrow succeeds on success', async () => {
  const result = await cmd('echo', ['ok']).orThrow();
  assertEquals(result.stdout.trim(), 'ok');
});

Deno.test('cmd - orThrow throws on failure', async () => {
  await assertRejects(
    () => cmd('deno', ['eval', 'Deno.exit(1)']).orThrow(),
    CmdError,
  );
});

Deno.test('cmd - CmdError properties', async () => {
  try {
    await cmd('deno', ['eval', 'Deno.exit(2)']).orThrow();
  } catch (err) {
    assertInstanceOf(err, CmdError);
    assertEquals(err.exitCode, 2);
    assert(err.message.includes('exit code: 2'));
    assertInstanceOf(err.result, CmdResult);
  }
});

Deno.test('cmd - stdin pipe', async () => {
  const result = await cmd('deno', [
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
  const result = await cmd('deno', ['eval', 'await new Promise(r => setTimeout(r, 50000))'])
    .timeout(100)
    .run();
  assertEquals(result.success, false);
  assert(result.code !== 0 || result.code === undefined);
});

Deno.test('cmd - environment variables', async () => {
  const result = await cmd('deno', ['eval', 'console.log(Deno.env.get("MY_VAR"))'])
    .env({ MY_VAR: 'custom_value' })
    .run();
  assertEquals(result.stdout.trim(), 'custom_value');
});

Deno.test('cmd - CmdResult.json parses stdout', async () => {
  const result = await cmd('echo', ['{"a":1,"b":"two"}']).run();
  const data = result.json<{ a: number; b: string }>();
  assertEquals(data.a, 1);
  assertEquals(data.b, 'two');
});

Deno.test('cmd - CmdResult.stdoutLines', async () => {
  const result = await cmd('echo', ['line1\nline2\nline3']).run();
  const lines = result.stdoutLines;
  assertEquals(lines.length, 3);
  assertEquals(lines[0], 'line1');
});

Deno.test('cmd - options object merges with fluent methods', async () => {
  const result = await cmd('echo', ['opts'])
    .options({ cwd: '/', dryRun: false })
    .run();
  assertEquals(result.success, true);
});

Deno.test('cmd - constructor options work', async () => {
  const instance = new Cmd('echo', ['ctor'], { dryRun: true });
  assertEquals(instance.opts.dryRun, true);
  const result = await instance.run();
  assertEquals(result.success, true);
  assertEquals(result.dryRun, true);
});

Deno.test('cmd - CmdResult.from for test mode', () => {
  const result = CmdResult.from('git', ['status']);
  assertEquals(result.success, false);
  assertEquals(result.command, 'git status');
  result.asSuccess();
  assertEquals(result.success, true);
});

Deno.test('Cmd - subclassable (DenoCmd pattern)', async () => {
  class DenoCmd<T = void, E extends Error = Error> extends Cmd<T, E> {
    constructor(args?: string[], opts?: CmdOptions) {
      super('deno', args, opts);
    }
  }

  const instance = new DenoCmd(['eval', 'console.log("subclass")']);
  const result = await instance.dryRun(false).run();
  assertEquals(result.success, true);
  assertEquals(result.stdout.trim(), 'subclass');
});

Deno.test('cmd - uid/gid passthrough (no-op test)', () => {
  const instance = cmd('echo', ['test']).uid(1000).gid(1000);
  const opts = instance.opts;
  assertEquals(opts.uid, 1000);
  assertEquals(opts.gid, 1000);
});

Deno.test('cmd - env merge preserves existing', () => {
  const instance = cmd('echo', ['env-test'])
    .env({ VAR1: 'one' })
    .env({ VAR2: 'two' });
  const opts = instance.opts;
  assertEquals(opts.env?.VAR1, 'one');
  assertEquals(opts.env?.VAR2, 'two');
});

Deno.test('cmd - orThrow returns result on success', async () => {
  const result = await cmd('echo', ['success']).orThrow();
  assertEquals(result.stdout.trim(), 'success');
});

Deno.test('cmd - stderr captured on failure', async () => {
  const result = await cmd('deno', ['eval', 'console.error("err msg"); Deno.exit(1)']).run();
  assertEquals(result.success, false);
  assert(result.stderr.includes('err msg') || result.stderr.length > 0);
});
