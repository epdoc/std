import type { FilePath } from '@epdoc/fs/fs';
import build from './build/build-info.json' with { type: 'json' };
import pkg from './deno.json' with { type: 'json' };
import { readFiles } from './src/mod.ts';

const version = pkg.version;
const buildNumber = build.build.number;
const buildDate = build.build.builtAt;
const userAgent = `${pkg.name}@${pkg.version}`;

const rawArgs = Deno.args;
const flags: string[] = [];
const files: FilePath[] = [];
let showMeta = false;
let digest = false;
let lookup = false;

for (const arg of rawArgs) {
  if (arg === '-v' || arg === '--version') {
    flags.push(arg);
  } else if (arg === '-h' || arg === '--help') {
    flags.push(arg);
  } else if (arg === '-m' || arg === '--meta') {
    showMeta = true;
  } else if (arg === '-d' || arg === '--digest') {
    digest = true;
  } else if (arg === '-l' || arg === '--lookup') {
    lookup = true;
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
  console.log('  -l, --lookup   Lookup actual address');
  Deno.exit(0);
}

if (files.length === 0) {
  console.error('Usage: deno run -A exif/main.ts [options] <file...>');
  Deno.exit(1);
}

try {
  const results = await readFiles(files, { digest: digest ? 'sha1' : false });

  for (const file of results) {
    if (lookup) {
      file.initLookup(userAgent);
      await file.lookupAddress();
    }
    const response = file.api.response;
    if (showMeta) {
      console.log('API Response', JSON.stringify(response, null, 2));
    }
  }

  const output = results.map((file) => file.info({ metadata: showMeta }));
  console.log(JSON.stringify(output, null, 2));
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  Deno.exit(1);
}
