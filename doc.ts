import { durationUtil } from './mod.ts';

console.log(durationUtil(-4443454).options('long').format());
console.log(durationUtil(-4443454).format());
console.log(durationUtil(3454, 'hms').format());
console.log(durationUtil(982440990, ':').format({ ms: false }));
// Useful when generating audible messages
console.log(
  durationUtil(982442990, 'long').options({ sep: ' ', ms: false }).format(),
);
// Same as previous, but use options to turn off both s and ms.
console.log(
  durationUtil(982442990, 'long').options({ sep: ' ', ms: false, s: false })
    .format(),
);
