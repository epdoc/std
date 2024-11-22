import * as dfs from 'jsr:@std/fs';
import path from 'node:path';
import pkg from '../deno.json' with { type: 'json' };

const template = {
  request: 'launch',
  name: 'Debug tests',
  type: 'node',
  cwd: '${workspaceFolder}',
  env: {},
  runtimeExecutable: '/Users/jpravetz/.deno/bin/deno',
  runtimeArgs: ['test', '--inspect-brk', '-RWES', './test/fs.test.ts'],
  attachSimplePort: 9229,
};

const pwd: string = import.meta.dirname as string;
const launchfile = path.resolve(pwd, '..', '.vscode', 'launch.json');
console.log('launch.json:', launchfile);

const result = { version: '0.2.0', configurations: [] };

const addTest = (entry: dfs.WalkEntry) => {
  if (entry.isFile && entry.name.endsWith('test.ts')) {
    console.log(name, entry.name, entry.path);
    const item = Object.assign({}, template, { name: `Debug ${entry.name}` });
    item.runtimeArgs = [];
    template.runtimeArgs.forEach((arg) => {
      item.runtimeArgs.push(arg);
    });
    item.runtimeArgs[item.runtimeArgs.length - 1] = entry.path;
    result.configurations.push(item as never);
  }
};

if (Array.isArray(pkg.workspace)) {
  await Promise.all(
    pkg.workspace.map(async (scope) => {
      for await (const entry of dfs.walk(path.resolve(pwd, '..', scope), { match: [/test\.ts$/] })) {
        entry.name = `${scope}/${entry.name}`;
        addTest(entry);
      }
    })
  );
} else {
  for await (const entry of Deno.readDir(path.resolve(pwd, '..'))) {
    (entry as dfs.WalkEntry).path = path.resolve(pwd, entry.name);
    addTest(entry as dfs.WalkEntry);
  }
}

Deno.writeTextFileSync(launchfile, JSON.stringify(result, null, 2));
