/**
 * Cross-runtime utilities for Deno, Node.js, and Bun compatibility.
 * Detects the runtime and uses optimal APIs for each, with fallbacks.
 */

import { _ } from '@epdoc/type';
import nodeFs from 'node:fs';
import nodeOs from 'node:os';
import nodePath from 'node:path';
import nodeProcess from 'node:process';
import { fileURLToPath as nodeFileURLToPath } from 'node:url';

/**
 * Runtime detection constants
 */
// deno-lint-ignore no-explicit-any
const g = globalThis as any;

/**
 * Runtime detection constants
 */
export type RuntimeInfo = {
  readonly Deno: boolean;
  readonly Node: boolean;
  readonly Bun: boolean;
};

export const Runtime: RuntimeInfo = {
  Deno: typeof g.Deno?.version?.deno === 'string',
  Node: typeof g.process?.version === 'string' && g.process?.version?.includes('node'),
  Bun: typeof g.Bun?.version === 'string',
};

/**
 * Gets the current runtime name
 */
export function getRuntime(): 'deno' | 'node' | 'bun' | 'unknown' {
  if (Runtime.Deno) return 'deno';
  if (Runtime.Bun) return 'bun';
  if (Runtime.Node) return 'node';
  return 'unknown';
}

/**
 * Gets the user's home directory using the optimal API for the current runtime
 */
export function getHomeDir(): string {
  // Deno has Deno.env.get('HOME') which is more direct
  if (Runtime.Deno) {
    const home = Deno.env.get('HOME') || Deno.env.get('USERPROFILE');
    if (home) return home;
  }

  // Bun has Bun.env.HOME
  if (Runtime.Bun) {
    const home = g.Bun?.env?.HOME || g.Bun?.env?.USERPROFILE;
    if (home) return home;
  }

  // Node.js fallback using os.homedir() (cross-platform)
  return nodeOs.homedir();
}

/**
 * Gets the current working directory using the optimal API for the current runtime
 */
export function getCwd(): string {
  if (Runtime.Deno) {
    return Deno.cwd();
  }
  return nodeProcess.cwd();
}

/**
 * Changes the current working directory using the optimal API for the current runtime
 * @throws Error if the operation fails
 */
export function setCwd(path: string): void {
  if (Runtime.Deno) {
    Deno.chdir(path);
    return;
  }
  nodeProcess.chdir(path);
}

/**
 * Gets an environment variable using the optimal API for the current runtime
 */
export function getEnv(key: string): string | undefined {
  if (Runtime.Deno) {
    return Deno.env.get(key);
  }

  if (Runtime.Bun) {
    return g.Bun?.env?.[key];
  }

  return nodeProcess.env[key];
}

/**
 * Gets the system temporary directory using the optimal API for the current runtime
 */
export function getTempDir(): string {
  if (Runtime.Deno) {
    // Deno has Deno.makeTempDir but not a direct temp dir getter
    // We can use Deno.env.get('TMPDIR') or fall back to os.tmpdir()
    return Deno.env.get('TMPDIR') || nodeOs.tmpdir();
  }

  if (Runtime.Bun) {
    return g.Bun?.env?.TMPDIR || nodeOs.tmpdir();
  }

  return nodeOs.tmpdir();
}

/**
 * Converts a file URL to a file path using the optimal API for the current runtime
 */
export function fileURLToPath(url: string | URL): string {
  if (Runtime.Deno) {
    // Use Deno's built-in URL handling
    return new URL(url).pathname;
  }

  return nodeFileURLToPath(url);
}

/**
 * Creates a temporary directory using the optimal API for the current runtime
 */
export async function makeTempDir(prefix?: string): Promise<string> {
  if (Runtime.Deno) {
    return await Deno.makeTempDir({ prefix });
  }

  // Node.js and Bun: use mkdtemp
  const tmpDir = getTempDir();
  const prefixPath = nodePath.join(tmpDir, prefix || 'tmp-');
  return await nodeFs.promises.mkdtemp(prefixPath);
}

/**
 * Creates a temporary file using the optimal API for the current runtime
 */
export async function makeTempFile(opts?: { prefix?: string; suffix?: string }): Promise<string> {
  if (Runtime.Deno) {
    return await Deno.makeTempFile(opts);
  }

  // Node.js and Bun: need to create file manually
  const tmpDir = getTempDir();
  const prefix = _.isString(opts?.prefix) ? opts!.prefix : 'tmp-';
  const prefixPath = nodePath.join(tmpDir, prefix);

  // Create a temp directory to hold our file (ensures uniqueness)
  const tmpFolder = await nodeFs.promises.mkdtemp(prefixPath);

  // Generate filename with optional suffix
  let filename = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36);
  if (opts?.suffix) {
    filename = `${filename}${opts.suffix}`;
  }

  const filePath = nodePath.join(tmpFolder, filename);

  // Create the file
  const fh = await nodeFs.promises.open(filePath, 'wx');
  await fh.close();

  // Move file to temp parent dir (we created a subdir for uniqueness)
  const finalPath = nodePath.join(tmpDir, filename);
  try {
    await nodeFs.promises.rename(filePath, finalPath);
    await nodeFs.promises.rmdir(tmpFolder);
    return finalPath;
  } catch {
    // If rename fails, return the path in the subdir
    return filePath;
  }
}

/**
 * Resolves path segments to an absolute path.
 * This is a cross-runtime wrapper around path.resolve that works consistently
 * across Deno, Node.js, and Bun.
 */
export function resolvePath(...paths: string[]): string {
  // All runtimes use the same Node.js-compatible path resolution
  return nodePath.resolve(...paths);
}
