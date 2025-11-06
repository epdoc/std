import { Duration, humanize } from '@epdoc/duration';

console.log(`
Demonstrates the output of humanize() and Duration.Formatter for an ever-increasing value.
`);

const values = [
  0,
  1,
  10,
  100,
  1000,
  2000,
  2500,
  5000,
  10000,
  29000,
  52500,
  53000,
  60000,
  90000,
  91000,
  3 * 60 * 1000,
  10 * 60 * 1000,
  10.49 * 60 * 1000,
  10.5 * 60 * 1000,
  30 * 60 * 1000,
  57 * 60 * 1000,
  60 * 60 * 1000,
  1.5 * 60 * 60 * 1000,
  10 * 60 * 60 * 1000,
  10.49 * 60 * 60 * 1000,
  10.5 * 60 * 60 * 1000,
  23.5 * 60 * 60 * 1000,
  24 * 60 * 60 * 1000,
  1.19 * 24 * 60 * 60 * 1000,
  1.49 * 24 * 60 * 60 * 1000,
  1.5 * 24 * 60 * 60 * 1000,
  1.9 * 24 * 60 * 60 * 1000,
  10 * 24 * 60 * 60 * 1000,
  10.49 * 24 * 60 * 60 * 1000,
  10.5 * 24 * 60 * 60 * 1000,
  13.5 * 24 * 60 * 60 * 1000,
  14 * 24 * 60 * 60 * 1000,
  30 * 24 * 60 * 60 * 1000,
  5 * 7 * 24 * 60 * 60 * 1000,
  7 * 7 * 24 * 60 * 60 * 1000,
  8 * 7 * 24 * 60 * 60 * 1000,
  26 * 7 * 24 * 60 * 60 * 1000,
  48 * 7 * 24 * 60 * 60 * 1000,
  11.5 * 30 * 24 * 60 * 60 * 1000,
  12 * 30 * 24 * 60 * 60 * 1000,
  365 * 24 * 60 * 60 * 1000,
  1.5 * 365 * 24 * 60 * 60 * 1000,
  2 * 365 * 24 * 60 * 60 * 1000,
  7 * 365 * 24 * 60 * 60 * 1000,
  10 * 365.25 * 24 * 60 * 60 * 1000,
  51 * 365.25 * 24 * 60 * 60 * 1000,
];

const formatter = new Duration.Formatter();

const w = [13, 24, 24];
console.log(`${'ms'.padStart(w[0])} ${'Humanize'.padStart(w[1])} ${'Narrow'.padStart(w[2])}`);
console.log(`${'---'.padStart(w[0])} ${'---'.padStart(w[1])} ${'---'.padStart(w[2])}`);

for (const ms of values) {
  const human = humanize(ms);
  const narrow = formatter.narrow.format(ms);
  console.log(`${String(Math.round(ms)).padStart(w[0])} ${human.padStart(w[1])} ${narrow.padStart(w[2])}`);
}
