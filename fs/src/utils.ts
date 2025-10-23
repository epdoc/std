import process from 'node:process';
import type { FolderPath } from './types.ts';

export function cwd(): FolderPath {
  return process.cwd() as FolderPath;
}
