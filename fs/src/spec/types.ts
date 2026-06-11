import type { Deep, Json } from '@epdoc/transform';
import type { Integer } from '@epdoc/type';
import type * as Util from '../util/types.ts';
import type { FileSpec } from './filespec.ts';
import type { FolderSpec } from './folderspec.ts';
import type { SymlinkSpec } from './symspec.ts';

export type TypedFSSpec = FileSpec | FolderSpec | SymlinkSpec;

/**
 * Options for {@link FileSpec.writeJson}, combining JSON formatting
 * with safe write semantics.
 */
/**
 * Options for {@link FileSpec.writeJson}, combining JSON formatting
 * with safe write semantics from {@link SafeWriteOptions}.
 */
export type WriteJsonOptions = Util.SafeWriteOptions & Deep.CopyOpts & {
  /**
   * A replacer function or array of property names passed to `JSON.stringify()`.
   * Controls which values are included in the JSON output.
   * If provided, Deep.CopyOpts is ignored.
   */
  replacer?: Json.Replacer;
  /**
   * Indentation for pretty-printing. Passed as the `space` argument to
   * `JSON.stringify()`. Use `2` for two-space indentation or `'\t'` for tabs.
   */
  space?: string | Integer;
  /**
   * Content to append after the final JSON closing brace/bracket.
   * Commonly set to `'\n'` for git-friendly file formatting.
   */
  trailing?: string;
};

export type ReadJsonOptions =
  & Deep.CopyOpts
  & Json.IStripComments
  & Json.IAutoTemporal
  & Json.IIncludeUrl
  & Json.IAutoRegExp
  & Json.IDecode
  & {
    /**
     * A reviver function to pass to JSON.parse. If provided, all other options are ignored except for stripCommands and includeUrl.
     */
    reviver?: Json.Reviver;
  };

export type WriteYamlOptions = {
  yaml?: Parameters<typeof import('@std/yaml').stringify>[1];
  write?: Util.SafeWriteOptions;
};
