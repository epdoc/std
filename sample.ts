import { Duration } from './mod.ts';

console.log('digital');
console.log(' ', Duration.util().digital.format(-4443454));
console.log(' ', Duration.util().digital.digits(0).format(-4443454));
console.log(' ', Duration.util().digital.format(3454)); // default 3 fractional digits
console.log(' ', Duration.util().digital.digits(0).format(3454.123456));
console.log(' ', Duration.util().digital.digits(6).format(3454.123456));
console.log(' ', Duration.util().digital.digits(9).format(3454.123456));

console.log('narrow');
console.log(' ', Duration.util().narrow.format(-4443454));
console.log(' ', Duration.util().narrow.max('minutes').digits(0).format(4443454));
console.log(' ', Duration.util().narrow.format(3454));

console.log('long');
console.log(' ', Duration.util().long.format(-4443454));
console.log(' ', Duration.util().long.separator(' ').digits(0).max('minutes').format(-4443454));

console.log('short');
console.log(' ', Duration.util().short.digits(0).format(982440990));
console.log(' ', Duration.util().short.digits(3).format(982440990));

import { dateUtil } from './mod.ts';

const d0 = new Date();
console.log(d0.toLocaleString());
console.log(d0.toISOString());
console.log(dateUtil(d0).toISOLocalString());
console.log(dateUtil(d0).toISOLocalString(false));

console.log(dateUtil(d0).julianDate());
console.log(dateUtil(d0).googleSheetsDate());

console.log(dateUtil(d0).format('YYYYMMDD_HHmmss'));
console.log(dateUtil(d0).formatUTC('YYYYMMDD_HHmmss'));
