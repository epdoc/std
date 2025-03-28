# @epdoc/string

A string wrapper that adds some common and some less common string methods.
Includes `msub`, a string replacement method that supports substitution of object
properties or array values.

## Install

```bash
deno add jsr:@epdoc/string
```

## StringEx

The `StringEx` class is a wrapper around a string. It includes a `replace` method that is based on msub. Methods of
StringEx include:

- [init](./ex.ts#init)
- [replace](./ex.ts#replace) - uses msub
- [pluralize](./ex.ts#pluralize) - pluralize a word
- [leftPad](./ex.ts#leftPad) - pad a string on the left
- [rightPad](./ex.ts#rightPad) - pad a string on the right
- [center](./ex.ts#center) - center a string
- [hexEncode](./ex.ts#hexEncode) - encodes a string as 16-bit hex
- [countLeadingTabs](./ex.ts#countLeadingTabs) - count the number of leading tabs in a string

Basic usage:

```ts
import { StringUtil } from '@epdoc/string';

const str: StringUtil = new StringUtil('\t\tHello, world!');
const count = str.countLeadingTabs();
console.log(`Count of leading tabs: ${count}`);
```

Or, more simply:

```ts
import { StringEx } from '@epdoc/string';

const count = StringEx('\t\tHello, world!').countLeadingTabs();
console.log(`Count of leading tabs: ${count}`);
```

StringEx also wraps msub, so you can use it like this:

```ts
import { StringEx } from '@epdoc/string';

const result = StringEx('My ${body}').replace({ body: 'eyes' });
console.log(result); // My eyes
```

StringEx also wraps msub, so you can use it as shown here. Each call to StringEx creates a new MSub instance, so you can
customize the substitution syntax for each StringEx instance.

```ts
import { StringEx } from '@epdoc/string';

const result1 = StringEx('My ${body}').replace({ body: 'hands' });
console.log(result1); // My hands

const result2 = StringEx('My [[body]]').init({ msub: { open: '[[' } }).replace({ body: 'nose' });
console.log(result2); // My nose

const result3 = StringEx('My ${body}').replace({ body: 'ears' });
console.log(result3); // My ears
```

## Msub

The Msub class allows runtime substitution of `${key}` in a string with a value, much like JavaScript
[template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals).

The msub functionality can be accessed as shown above using StringEx, or directly as a singleton that is created and
exposed via the [msub.init](./msub.ts#init) and [msub.replace](./msub.ts#replace) methods .

The [msub.init](./msub.ts#init) method is used to customize the substitution syntax. Each call to init will overwrite
all previous customizations. Because init and replace use the singleton, any settings will apply to all uses of msub in
your application. If you need to use different substitution syntaxes in different parts of your code, you can use
[StringEx](./ex.ts/#StringEx) to create and use separate MSub instances, each initialized with the appropriate options.

See [Customization](#Customization) below for more information.

```ts
import { msub } from '@epdoc/string';

msub.init({ open: '{{' });
const result = msub.exec('My {{body}}', { body: 'eyes' });
console.log(result);
```

### Default Use

The `msub` method replaces all instances of a `${prop}` in a string with a value. Substitutions may be specified as
property key/value pairs in an object, or as array entries.

```ts
import { msub } from '@epdoc/string';
import { expect } from 'jsr:@std/expect';

const newString1 = msub.replace('This ${a} ${bC} string', { bC: 'my', a: 'is' });
expect(newString1).toBe('This is my string');

const newString2 = msub.replace('This ${1} ${0} string', ['my', 'is']);
expect(newString2).toBe('This is my string');
```

### Date and Number formatting

In the special case where the key contains a colon and the replacement value is a Date or number, a formatter will be
called. For example

- `${a:toFixed:2}` will use Number's `toFixed(2)` method (tests if the value is a number and method exists on number).

- `${a:getFullYear}` will use Date's `getFullYear` method (tests if the value is a Date and method exists on Date).

- `${a:yyyyMMdd}` will require a [Format Function](#FormatFunction).

Note that in the first two cases, where the 2nd parameter is the name of a method on the object, a 3rd parameter is
allowed and will be passed to the specified number or Date function as a parameter.

```ts
import { msub } from '@epdoc/string';
import { expect } from 'jsr:@std/expect';

const result = msub.init().replace('There are ${a:toFixed:1} hours remaining', { a: 93 / 60 });
expect(result).toBe('There are 1.6 hours remaining');
```

```ts
import { msub } from '@epdoc/string';
import { expect } from 'jsr:@std/expect';
const ONE_HUNDRED_DAYS = 100 * 24 * 3600 * 1000;

const result = msub.replace('The year is ${a:getFullYear}', { a: new Date(ONE_HUNDRED_DAYS) });
expect(result).toBe('The year is 1970');
```

### Customization

[msub.init](./msub.ts#init) can be used to customize the substitution syntax, as has already been shown.

[msub.InitOptions](./msub.ts#InitOptions):

- `open` - the opening delimiter, defaults to `${`

- `close` - the closing delimiter, defaults to the matching closing brace for the opening delimiter. This is calculated
  by matching braces (`{}`, `()`, `[]`, `<>`). `%<[` will result in `]>` and not `]>%`. A custom close can be specified
  for other cases.

- ~~`uppercase` - if true, uppercase property names within the string are converted to camelcase before referencing
  values in the msub parameter dictionary. UNDER CONSTRUCTION.~~

- `format` - a [Format Function](#FormatFunction), if specified, to use to format values that contain a colon and that
  do not match a method on the value, as discussed in [Date and Number formatting](#Date-and-Number-formatting).

#### Format Function

```ts
import { dateEx } from '@epdoc/datetime';
import { msub } from '@epdoc/string';
import { expect } from 'jsr:@std/expect';

const d = new Date('2024-11-15T00:00:00.000Z');
const fmt1 = (_d: Date, _f: string) => {
  return dateEx(_d).tz(360).toISOLocalString();
};
const fmt2 = (d: Date, f: string) => {
  return dateEx(d).tz(0).format(f);
};

const r0 = msub.init({ format: fmt1 }).replace('The date is ${a:toISOString}', { a: d });
expect(r0).toBe('The date is 2024-11-15T00:00:00.000Z'); // fmt is ignored because toISOstring was found on the Date object

const r1 = msub.init({ format: fmt1 }).replace('The date is ${a}', { a: d });
expect(r1).toBe('The date is 2024-11-14T18:00:00.000-06:00');

const r2 = msub.init({ format: fmt2 }).replace('The date is ${a:yyyy/MM/dd}', { a: d });
expect(r2).toBe('The date is 2024/11/15');
```

### Create a new MSub instance

If using the exported `msub` singleton or [StringEx](./ex.ts/#StringEx) don't meet your requirements, you can also use
[msub.createMSub](./msub.ts#createMSub) to create a new MSub instance.

```ts
import { msub } from '@epdoc/string';
import { expect } from 'jsr:@std/expect';
const msub1: msub.MSub = msub.createMSub({ open: '{[' });
// const msub2: msub.MSub = msub.createMSub({ open: '{{', uppercase: true });

const result1 = msub1.replace('My {[body]}', { body: 'nose' });
expect(result1).toBe('My nose');

// const result2 = msub2.replace('My {{BODY}}', { body: 'fingers' });
// expect(result2).toBe('My fingers');

const result3 = msub.init({ open: '<<' }).replace('My <<body>>', { body: 'eyes' });
expect(result3).toBe('My eyes');
```

## Versions

`msub` has a previous life as an [npm
package](https://www.npmjs.com/package/msub). With the advent of string
literals, the need for msub has diminished, but it is still useful for some
applications.

## License

[MIT](./LICENSE)
