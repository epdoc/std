/**
 * @epdoc/type - Foundational type utilities for TypeScript/Deno
 *
 * Provides runtime type guards, deep copying with string substitution,
 * JSON serialization with special type preservation, and dictionary utilities.
 *
 * @module @epdoc/type
 *
 * @example Type Guards
 * ```typescript
 * import { isString, isNumber, isDate, isArray, isDict } from '@epdoc/type';
 *
 * const val: unknown = getSomeValue();
 * if (isString(val)) {
 *   console.log(val.toUpperCase()); // val is narrowed to string
 * } else if (isNumber(val)) {
 *   console.log(val.toFixed(2));    // val is narrowed to number
 * }
 * ```
 *
 * @example Deep Copy with Substitution
 * ```typescript
 * import { _ } from '@epdoc/type';
 *
 * const template = {
 *   apiUrl: '${baseUrl}/api',
 *   version: '${appVersion}'
 * };
 *
 * const config = _.deepCopy(template, {
 *   replace: { baseUrl: 'https://api.example.com', appVersion: '1.0.0' }
 * });
 * // Result: { apiUrl: 'https://api.example.com/api', version: '1.0.0' }
 * ```
 *
 * @example JSON Serialization with Special Types
 * ```typescript
 * import { jsonSerialize, jsonDeserialize } from '@epdoc/type';
 *
 * const data = {
 *   users: new Set(['alice', 'bob']),
 *   metadata: new Map([['version', '1.0']]),
 *   pattern: /^[a-z]+$/i,
 *   binary: new Uint8Array([1, 2, 3])
 * };
 *
 * const json = jsonSerialize(data);
 * const restored = jsonDeserialize(json);
 * // restored.users is a Set, restored.metadata is a Map, etc.
 * ```
 *
 * @example Stripping JSON Comments
 * ```typescript
 * import { stripJsonComments } from '@epdoc/type';
 *
 * const jsonc = `{\n  // This is a comment\n  "name": "value"\n}`;
 * const clean = stripJsonComments(jsonc);
 * const parsed = JSON.parse(clean);
 * ```
 */

// Re-export all modules
export * as _ from './combiner.ts';
export * from './dictutil.ts';
export { default as stripJsonComments } from './strip-comments.ts';
export * from './types.ts';
export * from './combiner.ts';
