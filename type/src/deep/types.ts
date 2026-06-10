export type CopyOpts =
  & {
    pre?: string;
    post?: string;
  }
  & (
    | { replace?: never; msubFn?: never } // No replacements
    | { replace: Record<string, string>; msubFn?: never } // Simple string replacements
    | { replace: Record<string, unknown>; msubFn: MSubFn } // Complex replacements with function
  );

export type CopyRegExp = { detectRegExp?: boolean };

export type CopyCommonOpts = {
  pre?: string;
  post?: string;
};

/**
 * Function type for deep copying an object.
 */
export type DeepCopyFn = (a: unknown, opts: CopyOpts) => unknown;

/**
 * Options for deep copying an object.
 */
export type MSubFn = (s: string, replace: Record<string, unknown>, pre?: string, post?: string) => string;
