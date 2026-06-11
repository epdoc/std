import { isRecordStringString } from '@epdoc/type';
import { msubLite } from '../utils.ts';
import type * as Deep from './types.ts';

/**
 * Type guard for the "simple replacements" case of DeepCopyOpts.
 * Uses isRecordStringString for runtime validation.
 */
export function hasSimpleReplacements(
  opts: Deep.CopyOpts,
): opts is Deep.CopyCommonOpts & { replace: Record<string, string>; msubFn?: never } {
  return opts.replace !== undefined &&
    isRecordStringString(opts.replace) &&
    opts.msubFn === undefined;
}

/**
 * Type guard for the "complex replacements" case of DeepCopyOpts.
 */
export function hasComplexReplacements(
  opts: Deep.CopyOpts,
): opts is Deep.CopyCommonOpts & { replace: Record<string, unknown>; msubFn: Deep.MSubFn } {
  return opts.replace !== undefined &&
    opts.msubFn !== undefined;
}

/**
 * Core string processing that both serialize and deserialize use.
 * This is where isRecordStringString is actually used.
 */
export function processStringWithReplacements(str: string, options: Deep.CopyOpts): string {
  if (!options.replace) {
    return str;
  }
  const opts: Deep.CopyOpts = { pre: '${', post: '}', ...options };

  if (opts.msubFn) {
    // Complex case: use custom handler
    return opts.msubFn(str, opts.replace, opts.pre, opts.post);
  }

  // Simple case: must be Record<string, string>
  // This is where isRecordStringString provides runtime type safety
  if (isRecordStringString(opts.replace)) {
    return msubLite(str, opts.replace, opts.pre!, opts.post!);
  }

  // Defensive: TypeScript says this shouldn't happen, but runtime might differ
  throw new Error(
    'Invalid replacement configuration. When msubFn is not provided, ' +
      'replace must be Record<string, string>. ' +
      `Got keys with types: ${
        Object.entries(opts.replace)
          .map(([k, v]) => `${k}: ${typeof v}`)
          .join(', ')
      }`,
  );
}
