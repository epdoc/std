# @epdoc/string

A string wrapper that adds common string methods. Includes msub, a string replacement method that supports substitution
of object properties or array values.

## Install

```bash
deno add:@epdoc/string
```

## StringEx

The `StringEx` class is a wrapper around the `String` prototype that adds the `msub` method.

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

const result = StringEx('My ${body}').msub({ body: 'eyes' });
console.log(result);
```

```ts
import { msub, msubInit } from '@epdoc/string';

const result = StringEx('My ${body}').msub({ body: 'eyes' });
console.log(result);
```

## msub

The msub functionality allows runtime substitution of `${key}` in a string with a value, much like JavaScript
[template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals).

The msub functionality can be accessed as shown above using StringEx, or directly as a singleton that is created. Using
a singleton is useful if you need to call the `init` method.

The init method is used to customize the substitution syntax.

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

const newString = msub.exec('This ${a} ${bC} string', { bC: 'my', a: 'is' });
const newString = msub.exec('This ${1} {$0} string', 'my', 'is');
const newString = msub.exec('This ${1} ${0} string', ['my', 'is']);
```

Or, if using typescript, you can call the `addMsubPrototypeMethods` function to add the `msub` method to the `String`
prototype.

```ts
import { addMsubPrototypeMethods } from '@epdoc/string';
addMsubPrototypeMethods();

const newString = 'This ${a} ${bC} string'.msub({ bC: 'my', a: 'is' });
const newString = 'This ${1} {$0} string'.msub('my', 'is');
const newString = 'This ${1} ${0} string'.msub(['my', 'is']);
```

#### Arguments

Accepts arguments in the following ways:

- Object: Key, value pair where all instances of `${key}` are replaced with it's value. Values can be strings, numbers,
  booleans or, Date objects.

```ts
import { msub } from '@epdoc/string';

const myObj = {
  id: 123,
  cn: 'My common name',
  transId: '446',
};

// Output the values of myObj
console.log(msub.replace('Processing object ${id}, ${cn} for ${transId}', myObj));
// Processing object 123, My common name for 446
```

- In the special case where the key contains a colon and the value is a date or number, a formatter will be called. For
  example
  - `${a:toFixed:2}` will use Number's `toFixed(2)` method (tests if the value is a number and method exists on number).
  - `${a:getFullYear}` will use Date's `getFullYear` method (tests if the value is a Date and method exists on Date).
  - `${a:YYYYMMDD}` will use the `format` callback if specified. Format is covered later in this document.

```ts
import { msub } from '@epdoc/string';

const result = msub.init().replace('There are ${a:toFixed:1} hours remaining', { a: 93 / 60 });
console.log(result);
// There are 1.6 hours remaining
```

```ts
import { msub } from '@epdoc/string';
const ONE_HUNDRED_DAYS = 100 * 24 * 3600 * 1000;

const result = msub.replace('The year is ${a:getFullYear}', { a: new Date(ONE_HUNDRED_DAYS) });
console.log(result);
// The year is 1970
```

- A list of arguments can be used to replace `${0}`, `${1}`, `${2}`, etc. with the first, second, third, etc argument
  value.

```javascript
import { msub } from '@epdoc/string';
const obj1 = ['instance', 'string'];
console.log(msub.replace('This ${0} of ${1} actually belongs in the string', obj1));
//This instance of string actually belongs in the string

const obj2 = { s: 'instance' };
console.log(msub.replace('This ${s} of ${0} actually belongs in the string', obj2));
// This instance of ${0} actually belongs in the string
```

### Customization

Call the `init` method to customize the substitution syntax. Init options are:

- `open` (_string_) - Specify an open string delimiter, for example use `{` to use `{myString}` rather than
  `${myString}`. Defaults to `${`.
- `close` (_string_) - Specify a close string delimiter. Defaults to the matching closing brace for the opening
  delimiter.
- `uppercase` (_boolean_) - If true, uppercase property names within the string are converted to camelcase before
  referencing values in the msub parameter dictionary (_e.g._ `MY_STRING` becomes `myString`).
- `format` (_function_) - Callback, if specified, to use to format values that contain a colon. Called with the value
  and the optional portion of the substitution that is after the colon (see _Formatting_ below).

The `close` option can be left out, and msub will automatically select the closing delimiter that matches the opening
delimiter, but will only use matching braces from `{}`, `[]`, `<>` or `()`. For example, if `open` is `${<` then `close`
will be set to `>}`. If `open` is `%{{` then `close` will be set to `}}`. If you want close to be `}}%` then you need to
set close to this value.

#### Scope

If using the exported `msub` singleton, customizations will apply across all uses of msub. Similarly, StringEx uses this
singleton, so customizations will apply to all StringEx instances.

## Initialization Options

If you need to use different substitution syntaxes in different parts of your code, you can create and use separate MSub
instances, each initialized with the appropriate options.

```ts
import { MSub } from '@epdoc/string';

const msub1 = createMSub({ open: '{{' });
const msub2 = createMSub({ open: '{{', uppercase: true });

const result1 = msub1.exec('My {{body}}', { body: 'nose' });
console.log(result1); // My nose

const result2 = msub2.exec('My {{BODY}}', { body: 'fingers' });
console.log(result2); // My fingers

const result3 = createMSub({ open: '<<' }).exec('My <<body>>', { body: 'eyes' });
console.log(result3); // My eyes
```

Supported matching braces:

```ts
'{': '}',
'(': ')',
'[': ']',
'<': '>',
```

To use string delimiter

```javascript
require('msub')({ open: '{' });
const newString = 'This {a} {bC} string'.msub({ bC: 'my', a: 'is' });
```

To support uppercase property names of form `{MY_STRING}` that are converted to camelcase (_MY_STRING_ becomes
_myString_).

```javascript
require('msub')({ uppercase: true });
const newString = 'This ${A} ${B_C} string'.msub({ bC: 'my', a: 'is' });
```

### Formatting

`msub` supports custom formatting of numbers and Date objects via

- the `format` callback option, set using the `init` method.
- method names and parameters specified as part of the substitution key (_e.g._ `${n:toFixed:2}`).
  - the method name must exist on the value, otherwise the `format` callback will be used if it exists.

Example using the [moment](https://momentjs.com/) package.

```javascript
const moment = require('moment');

require('../dist').msub.init({
  format: function (value, format) {
    if (format && value instanceof Date) {
      return moment(value).format(format);
    }
    return value;
  },
});

const newString = 'Today ${a:YYYYMMDD} and the year ${b:getFullYear} and ${c:} were the best ${d:toFixed:2}'.msub(
  { a: new Date(), b: new Date(1999, 12), c: undefined, d: 43.2345 },
);
console.log(newString);
```

outputs:

```bash
Today 20190808 and the year 2000 and ${c:} were the best 43.23
```

## Versions

### Version 3

- Zero external dependencies (previously might have imported `moment` library)
- Specifies types for typescript
- Changes to `init` method options:
  - Removes `moment` and the optional import of [moment.js](http://momentjs.com/) library and passes responsibility for
    date formatting to the caller.
  - Adds `format` callback option that can be used for any value, just add a colon and optional format string.
  - Adds `close` option
  - Closing brace defaults to mirror of `open` option if `open` is one of `{`, `[`, `<` or `(`.

If you are not using `moment` then you should be safe to upgrade. If you are using `moment`, you will need to add a
`format` callback option.

### Version 2

Version 2 default string replacement specifiers are similar to ES6 string literals, using the syntax
`${myVariableName}`. Version 2 default behaviour breaks the default version 0.x behaviour.

Initialize msub to use v0.x.x default behaviour as following:

```javascript
require('msub')({ open: '{', moment: true, uppercase: true });

const newString = 'This {A} {B_C} string'.msub({ bC: 'my', a: 'is' });
```

## Tests

To run the test suite, first install the dependencies, then run npm test:

```bash
$ npm install
$ npm test
```

## License

[MIT](https://github.com/strongloop/express/blob/master/LICENSE)
