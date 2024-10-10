// ex. scripts/build_npm.ts
import { build, emptyDir } from '@deno/dnt';
import pkg from '../deno.json' with { type: 'json' };

await emptyDir('./npm');

await build({
  entryPoints: ['./mod.ts'],
  outDir: './npm',
  typeCheck: false,
  test: false,
  shims: {
    // see JS docs for overview and more options
    deno: true,
  },
  package: {
    // package.json properties
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    license: pkg.license,
    repository: {
      type: 'git',
      url: 'git+https://github.com/epdoc/timeutil.git',
    },
    bugs: {
      url: 'https://github.com/epdoc/timeutil/issues',
    },
  },
  postBuild() {
    // steps to run after building and before running the tests
    Deno.copyFileSync('LICENSE', 'npm/LICENSE');
    Deno.copyFileSync('README.md', 'npm/README.md');
  },
});
