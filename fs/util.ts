import { FileSpec } from './filespec.ts';
import { FolderSpec } from './folderspec.ts';
import { FSSpec } from './fsspec.ts';
import { SymlinkSpec } from './symspec.ts';

/**
 * Joins continuation lines in a string array.
 * @param lines - The array of lines to join.
 * @param continuation - The regular expression or string that delimits
 * continuation lines. If a regular expression, the part of the line before the
 * match must be returned. For example, `new RegExp(/^(.*)\\\s*$/)`.
 * @returns The joined lines.
 */
export function joinContinuationLines(lines: string[], continuation: string | RegExp): string[] {
  const regex = typeof continuation === 'string' ? new RegExp('^(.*)' + continuation + '\\s*$') : continuation;
  const result: string[] = [];
  for (let idx = 0; idx < lines.length; ++idx) {
    let line = lines[idx];
    const p = line.match(regex);
    if (p) {
      line = p[1];
      if (idx + 1 < lines.length) {
        line += lines[idx + 1].replace(/^\s+/, '');
        lines[idx + 1] = line;
      }
    } else {
      result.push(line);
    }
  }
  return result;
}

export function resolveType(
  file: string | FSSpec | FileSpec | FolderSpec | SymlinkSpec,
): Promise<FSSpec | FileSpec | FolderSpec | SymlinkSpec> {
  if (file instanceof FileSpec || file instanceof FolderSpec || file instanceof SymlinkSpec) {
    return Promise.resolve(file);
  }
  if (file instanceof FSSpec) {
    return file.getResolvedType();
  }
  return new FSSpec(file).getResolvedType();
}
