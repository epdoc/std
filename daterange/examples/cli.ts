#!/usr/bin/env -S deno run --allow-env

import { parseArgs } from 'jsr:@std/cli/parse-args';
import { dateEx } from '../../datetime/date.ts';
import { asInt } from '../../type/util.ts';
import { dateList, type DateRangeDef } from '../mod.ts';

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
  const flags = parseArgs(Deno.args, {
    alias: { h: 'hour' },
    default: { hour: '0' },
    string: ['hour'],
  });

  const h = asInt(flags.hour, 0);
  const dateSpecs = flags._;

  if (dateSpecs.length === 0) {
    console.error('Usage: cli.ts [-h <hour>] <date-range-spec>...');
    console.error('Example: cli.ts 20240101-20240110 20240215');
    Deno.exit(1);
  }

  const dateRanges: DateRangeDef[] = dateList(dateSpecs.join(','), h);

  const output = dateRanges.map((range) => ({
    after: range.after ? dateEx(range.after).toISOLocalString() : undefined,
    before: range.before ? dateEx(range.before).toISOLocalString() : undefined,
  }));

  console.log(JSON.stringify(output, null, 2));
}

if (import.meta.main) {
  main();
}
