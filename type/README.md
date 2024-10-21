# TypeUtil Library

## Overview

The TypeUtil Library provides a set of utility functions and classes for working with dictionary-like objects in
JavaScript/TypeScript. It includes type checking, property retrieval, and conversion functions, making it easier to
manipulate and validate data structures.

## Installation

To install the library, you can use npm or yarn:

`npm install typeutil`

or

`yarn add typeutil`

## Usage

To use the library, import the necessary functions and classes in your TypeScript or JavaScript file:

```typescript
import { DictUtil, dictUtil, isBoolean, isString, isType } from 'typeutil';

// Example usage
const myDict = { name: 'John', age: 30 };
const util = dictUtil(myDict);

console.log(util.prop('name').asString()); // Output: John
console.log(util.isType('string')); // Output: true
console.log(isBoolean(true)); // Output: true
console.log(isString('Hello')); // Output: true
```

## API Documentation

### Types

#### `DictUtilOpts`

Options for the `DictUtil` constructor.

- `throw` (boolean): Whether to throw an error if a property is not found.
- `src` (string | IDictUtilSource): The source of the value.

#### `IDictUtilSource`

Interface for a source that can be converted to a string.

### Functions

#### `dictUtil(val: unknown, opts?: DictUtilOpts): DictUtil`

Creates a new `DictUtil` instance.

- **Parameters:**
  - `val`: The value to wrap in the `DictUtil`.
  - `opts`: Options for the `DictUtil`.

- **Returns:** A new instance of `DictUtil`.

#### `isType(val: unknown, ...types: (string | string[])[]): boolean`

Verify that `val` is any one of the basic types.

- **Parameters:**
  - `val`: The value to be tested.
  - `types`: The types to check against.

- **Returns:** True if the value matches any of the specified types, otherwise false.

#### `isBoolean(val: unknown): val is boolean`

Checks if the given value is a boolean.

- **Parameters:**
  - `val`: The value to check.

- **Returns:** True if the value is a boolean, otherwise false.

#### `isString(val: unknown): val is string`

Checks if the given value is a string.

- **Parameters:**
  - `val`: The value to check.

- **Returns:** True if the value is a string, otherwise false.

#### `isNumber(val: unknown): val is number`

Checks if the given value is a number.

- **Parameters:**
  - `val`: The value to check.

- **Returns:** True if the value is a number, otherwise false.

#### `isInteger(val: unknown): val is Integer`

Checks if the given value is an integer.

- **Parameters:**
  - `val`: The value to check.

- **Returns:** True if the value is an integer, otherwise false.

#### `isPosInteger(val: unknown): val is Integer`

Checks if the given value is a positive integer.

- **Parameters:**
  - `val`: The value to check.

- **Returns:** True if the value is a positive integer, otherwise false.

#### `isWholeNumber(val: unknown): val is Integer`

Checks if the given value is a whole number.

- **Parameters:**
  - `val`: The value to check.

- **Returns:** True if the value is a whole number, otherwise false.

#### `isNonEmptyString(val: unknown): val is string`

Checks if the given value is a non-empty string.

- **Parameters:**
  - `val`: The value to check.

- **Returns:** True if the value is a non-empty string, otherwise false.

#### `isFunction(val: unknown): val is Function`

Checks if the given value is a function.

- **Parameters:**
  - `val`: The value to check.

- **Returns:** True if the value is a function, otherwise false.

#### `isDate(val: unknown): val is Date`

Checks if the given value is a Date object.

- **Parameters:**
  - `val`: The value to check.

- **Returns:** True if the value is a Date, otherwise false.

#### `isValidDate(val: unknown): val is Date`

Checks if the given value is a valid Date object.

- **Parameters:**
  - `val`: The value to check.

- **Returns:** True if the value is a valid Date, otherwise false.

#### `isArray(val: unknown): val is unknown[]`

Checks if the given value is an array.

- **Parameters:**
  - `val`: The value to check.

- **Returns:** True if the value is an array, otherwise false.

#### `isNonEmptyArray(val: unknown): val is unknown[]`

Checks if the given value is a non-empty array.

- **Parameters:**
  - `val`: The value to check.

- **Returns:** True if the value is a non-empty array, otherwise false.

#### `isRegExp(val: unknown): val is RegExp`

Checks if the given value is a RegExp object.

- **Parameters:**
  - `val`: The value to check.

- **Returns:** True if the value is a RegExp, otherwise false.

#### `isNull(val: unknown): val is null`

Checks if the given value is null.

- **Parameters:**
  - `val`: The value to check.

- **Returns:** True if the value is null, otherwise false.

#### `isDefined(val: unknown): boolean`

Checks if the given value is defined (not undefined).

- **Parameters:**
  - `val`: The value to check.

- **Returns:** True if the value is defined, otherwise false.

#### `hasValue(val: unknown): boolean`

Checks if the given value has a value (not null or undefined).

- **Parameters:**
  - `val`: The value to check.

- **Returns:** True if the value has a value, otherwise false.

#### `isEmpty(obj: unknown): boolean`

Checks if the given object is empty (no own properties).

- **Parameters:**
  - `obj`: The object to check.

- **Returns:** True if the object is empty, otherwise false.

#### `isError(val: unknown): val is Error`

Checks if the given value is an Error object.

- **Parameters:**
  - `val`: The value to check.

- **Returns:** True if the value is an Error, otherwise false.

#### `isObject(val: unknown): val is object`

Checks if the given value is an object (not an array or Date).

- **Parameters:**
  - `val`: The value to check.

- **Returns:** True if the value is an object, otherwise false.

### Classes

#### `DictUtil`

A utility class for working with dictionary-like objects.

- **Constructor:**
  - `constructor(val?: unknown, opts: DictUtilOpts = {})`

- **Methods:**
  - `prop(...path: string[]): DictUtil`
    - Retrieves a property at the specified path.
  - `property(...path: string[]): DictUtil`
    - Retrieve the property at the nested path within this object.
  - `throw(v?: boolean): DictUtil`
    - Sets whether to throw an error if a property is not found.
  - `val(): unknown`
    - Return the raw value of this object.
  - `value(): unknown`
    - Return the raw value of this object (alias for `val`).
  - `asBoolean(defval = false): boolean`
    - Converts the value to a boolean.
  - `asInt(defVal = 0): Integer`
    - Converts the value to an integer.
  - `asFloat(defVal: number = 0, commaAsDecimal = false): number`
    - Converts the value to a float.
  - `asString(): string`
    - Converts the value to a string.
  - `asRegExp(): RegExp | undefined`
    - Converts the value to a RegExp.
  - `isDict(): boolean`
    - Checks if the value is a dictionary.
  - `isBoolean(): boolean`
    - Checks if the value is a boolean.
  - `isString(): boolean`
    - Checks if the value is a string.
  - `isNumber(): boolean`
    - Checks if the value is a number.
  - `isPosNumber(): boolean`
    - Checks if the value is a positive number.
  - `isInteger(): boolean`
    - Checks if the value is an integer.
  - `isPosInteger(): boolean`
    - Checks if the value is a positive integer.
  - `isWholeNumber(): boolean`
    - Checks if the value is a whole number.
  - `isNonEmptyString(): boolean`
    - Checks if the value is a non-empty string.
  - `isFunction(): boolean`
    - Checks if the value is a function.
  - `isDate(): boolean`
    - Checks if the value is a Date object.
  - `isValidDate(): boolean`
    - Checks if the value is a valid Date object.
  - `isArray(): boolean`
    - Checks if the value is an array.
  - `isNonEmptyArray(): boolean`
    - Checks if the value is a non-empty array.
  - `isRegExp(): boolean`
    - Checks if the value is a RegExp object.
  - `isRegExpDef(): boolean`
    - Checks if the value is a valid RegExp definition.
  - `isNull(): boolean`
    - Checks if the value is null.
  - `isDefined(): boolean`
    - Checks if the value is defined (not undefined).
  - `hasValue(): boolean`
    - Checks if the value has a value (not null or undefined).
  - `isEmpty(): boolean`
    - Checks if the value is empty (for objects, arrays, etc.).
  - `isError(): boolean`
    - Checks if the value is an Error object.
  - `isObject(): boolean`
    - Checks if the value is an object (not an array or Date).
  - `isType(...types: (string | string[])[]): boolean`
    - Checks if the value matches any of the specified types.

## Contributing

If you would like to contribute to this library, please fork the repository and submit a pull request. Ensure that your
code adheres to the existing style and includes appropriate tests.

## License

This library is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.
