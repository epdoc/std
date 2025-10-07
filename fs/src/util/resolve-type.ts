import { type BaseSpec, FileSpec, FolderSpec, FSSpec, SymlinkSpec } from '../spec/mod.ts';
/**
 * Joins continuation lines in a string array.
 * @param lines - The array of lines to join.
 * @param continuation - The regular expression or string that delimits
 * continuation lines. If a regular expression, the part of the line before the
 * match must be returned. For example, `new RegExp(/^(.*)\\\s*$/)`.
 * @returns The joined lines.
 */
export function joinContinuationLines(lines: string[], continuation: string | RegExp): string[] {
  const regex = typeof continuation === 'string' ? new RegExp('^(.*)' + continuation + '\s*$') : continuation;
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

export async function resolveType(
  file: string | BaseSpec,
): Promise<FSSpec | FileSpec | FolderSpec | SymlinkSpec> {
  if (file instanceof FileSpec || file instanceof FolderSpec || file instanceof SymlinkSpec) {
    return file;
  }
  if (file instanceof FSSpec) {
    return await file.getResolvedType();
  }
  const result = await new FSSpec(file).getResolvedType();
  return result;
}
