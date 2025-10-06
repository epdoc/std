import { duration } from '../mod.ts';

console.log('digital');
console.log(' ', duration().digital.format(-4443454));
console.log(' ', duration().digital.digits(0).format(-4443454));
console.log(' ', duration().digital.format(3454)); // default 3 fractional digits
console.log(' ', duration().digital.digits(0).format(3454.123456));
console.log(' ', duration().digital.digits(6).format(3454.123456));
console.log(' ', duration().digital.digits(9).format(3454.123456));

console.log('narrow');
console.log(' ', duration().narrow.format(-4443454));
console.log(' ', duration().narrow.max('minutes').digits(0).format(4443454));
console.log(' ', duration().narrow.format(3454));

console.log('long');
console.log(' ', duration().long.format(-4443454));
console.log(' ', duration().long.separator(' ').digits(0).max('minutes').format(-4443454));

console.log('short');
console.log(' ', duration().short.digits(0).format(982440990));
console.log(' ', duration().short.digits(3).format(982440990));
