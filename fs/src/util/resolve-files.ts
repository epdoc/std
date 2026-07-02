import { Walk } from '@epdoc/fs';
import * as FS from '@epdoc/fs/fs';

export type IRecursive = {
  recursive?: boolean;
};

/**
 * Given a list of paths, resolves them to `FS.File` objects. If a path is a folder and the
 * `recursive` option is set to true, it will recursively resolve all files within that folder.
 *
 * Typical use case is to resolve the list of files from the command line arguments, where some
 * arguments may be folders and you want to include all files within those folders (if reursive).
 * @param args - An array of string paths to resolve.
 * @param opts - Optional settings for file resolution, including whether to resolve files
 * recursively within folders.
 * @returns A promise that resolves to an array of `FS.File` objects.
 */
export async function resolveFiles(
  args: string[],
  opts: IRecursive = {},
): Promise<FS.File[]> {
  const files: FS.File[] = [];
  const recursive = opts.recursive ?? false;

  for (const arg of args) {
    const spec = new FS.Spec(arg);
    const resolved = await spec.resolvedType();

    if (!resolved) {
      continue;
    }

    if (FS.File.is(resolved)) {
      files.push(resolved);
    } else if (FS.Folder.is(resolved) && recursive) {
      for await (
        const entry of Walk.walk(resolved, {
          includeFiles: true,
          includeDirs: false,
          maxDepth: Infinity,
        })
      ) {
        if (FS.File.is(entry)) {
          files.push(entry);
        }
      }
    }
  }

  return files;
}

/**
 * @param args
 * @returns
 * @experimental
 */
export async function resolveFolders(args: string[]): Promise<FS.Folder[]> {
  const folders: FS.Folder[] = [];

  for (const arg of args) {
    const folder = new FS.Folder(arg);
    if (await folder.isFolder()) {
      folders.push(folder);
    }
  }

  return folders;
}
