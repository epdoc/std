import * as Spec from '../spec/mod.ts';
import * as Walk from '../walk/mod.ts';

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
): Promise<Spec.FileSpec[]> {
  const files: Spec.FileSpec[] = [];
  const recursive = opts.recursive ?? false;

  for (const arg of args) {
    const spec = new Spec.FSSpec(arg);
    const resolved = await spec.resolvedType();

    if (!resolved) {
      continue;
    }

    if (Spec.FileSpec.is(resolved)) {
      files.push(resolved);
    } else if (Spec.FolderSpec.is(resolved) && recursive) {
      for await (
        const entry of Walk.walk(resolved, {
          includeFiles: true,
          includeDirs: false,
          maxDepth: Infinity,
        })
      ) {
        if (Spec.FileSpec.is(entry)) {
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
export async function resolveFolders(args: string[]): Promise<Spec.FolderSpec[]> {
  const folders: Spec.FolderSpec[] = [];

  for (const arg of args) {
    const folder = new Spec.FolderSpec(arg);
    if (await folder.isFolder()) {
      folders.push(folder);
    }
  }

  return folders;
}
