#!/usr/bin/env -S deno run --allow-env

import { dateList, type DateRangeDef } from '../src/mod.ts';

/**
 * A command-line tool to parse date range strings.
 *
 * It takes a list of date range specifications, processes them,
 * and outputs an array of date range objects.
 *
 * Usage:
 *   deno run --allow-env cli.ts [options] <date-spec...>
 *
 * Options:
 *   -h, --hour <hour>  The default hour to use for dates (default: 0).
 *
 * Example:
 *   deno run --allow-env cli.ts -h 8 "20240701-20240710" "20240801"
 */
function main() {
  const args = [...Deno.args];
  let hourStr = '0';
  const dateSpecs: string[] = [];

  while (args.length > 0) {
    const arg = args.shift()!;
    if (arg === '-h' || arg === '--hour') {
      hourStr = args.shift() ?? '0';
    } else if (arg.startsWith('--hour=')) {
      hourStr = arg.split('=')[1];
    } else if (arg.startsWith('-')) {
      // Ignore other flags
    } else {
      dateSpecs.push(arg);
    }
  }

  const h = parseInt(hourStr, 10);

  if (dateSpecs.length === 0) {
    console.error('Usage: cli.ts [-h <hour>] <date-range-spec>...');
    console.error('Example: cli.ts 20240101-20240110 20240215');
    Deno.exit(1);
  }

  const dateRanges: DateRangeDef[] = dateList(dateSpecs.join(','), { defaultHour: h });

  const output = dateRanges.map((range) => ({
    after: range.after?.toString(),
    before: range.before?.toString(),
  }));

  console.log(JSON.stringify(output, null, 2));
}

if (import.meta.main) {
  main();
}
