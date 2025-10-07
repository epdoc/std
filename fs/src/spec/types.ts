import type * as dfs from '@std/fs';
import type * as FS from '../types.ts';

export type FolderDiff = {
  missing: FS.Name[];
  added: FS.Name[];
  diff: FS.Name[];
};

export type WalkOptions = dfs.WalkOptions;
