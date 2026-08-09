import type { FilePath } from '@epdoc/fs/fs';
import build from './build/build-info.json' with { type: 'json' };
import pkg from './deno.json' with { type: 'json' };
import { type FileInfo, Reader } from './src/mod.ts';

const version = pkg.version;
const buildNumber = build.build.number;
const buildDate = build.build.builtAt;

const rawArgs = Deno.args;
const flags: string[] = [];
const files: FilePath[] = [];
let showMeta = false;
let digest = false;

for (const arg of rawArgs) {
  if (arg === '-v' || arg === '--version') {
    flags.push(arg);
  } else if (arg === '-h' || arg === '--help') {
    flags.push(arg);
  } else if (arg === '-m' || arg === '--meta') {
    showMeta = true;
  } else if (arg === '-d' || arg === '--digest') {
    digest = true;
  } else {
    files.push(arg as FilePath);
  }
}

if (flags.includes('-v') || flags.includes('--version')) {
  console.log(`${version} build:${buildNumber} ${buildDate}`);
  Deno.exit(0);
}

if (flags.includes('-h') || flags.includes('--help')) {
  console.log('Usage: deno run -A exif/main.ts [options] <file...>');
  console.log('');
  console.log('Options:');
  console.log('  -v, --version  Show version information');
  console.log('  -h, --help     Show this help message');
  console.log('  -m, --meta     Include raw exiftool metadata in output');
  console.log('  -d, --digest   Compute file digest');
  Deno.exit(0);
}

if (files.length === 0) {
  console.error('Usage: deno run -A exif/main.ts [options] <file...>');
  Deno.exit(1);
}

const reader = new Reader();
try {
  const results = await reader.read(files);
  const output = results.map((file) => {
    const result: FileInfo = file.info({ metadata: showMeta });

    return result;
  });
  console.log(JSON.stringify(output, null, 2));
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  Deno.exit(1);
}
