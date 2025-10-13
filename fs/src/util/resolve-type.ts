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
  const regex = typeof continuation === 'string' ? new RegExp('^(.*)' + continuation + '\\s*$') : continuation;
  const result: string[] = [];

  for (let idx = 0; idx < lines.length; ++idx) {
    let line = lines[idx];
    const p = line.match(regex);

    if (p) {
      // Remove the continuation character and any trailing whitespace
      line = p[1];

      // Keep combining with subsequent lines until we find one without continuation
      while (idx + 1 < lines.length) {
        const nextLine = lines[idx + 1];
        line += nextLine.replace(/^\s+/, '');
        idx++; // Skip the next line since we've merged it

        // Check if the merged line still ends with continuation
        const nextMatch = line.match(regex);
        if (nextMatch) {
          line = nextMatch[1]; // Remove the continuation character
        } else {
          break; // No more continuation, exit the while loop
        }
      }
    }

    result.push(line);
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
