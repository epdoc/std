export type Milliseconds = number;

export type LineHandler = (line: string) => void;

/**
 * Per-line callbacks for live output streaming. When set, the command runs
 * with piped stdout/stderr and each line is delivered as it arrives instead of
 * being buffered until the process exits.
 */
export interface StreamOptions {
  stdout?: LineHandler;
  stderr?: LineHandler;
}

export interface CmdOptions<T = unknown> {
  cwd?: string;
  env?: Record<string, string>;
  clearEnv?: boolean;
  dryRun?: boolean;
  timeout?: Milliseconds;
  stdin?: string | Uint8Array;
  interactive?: boolean;
  signal?: AbortSignal;
  uid?: number;
  gid?: number;
  silent?: boolean;
  outParser?: (result: ICmdResult) => T;
  errParser?: (result: ICmdResult) => Error;
  stream?: StreamOptions;
}

export interface ICmdResult {
  stdout: string;
  stderr: string;
  command: string;
  exitCode?: number;
}

export const Stream = {
  stdout: 'stdout',
  stderr: 'stderr',
} as const;
export type StreamTag = typeof Stream[keyof typeof Stream];
export const StreamEnum: StreamTag[] = Object.values(Stream);
export function isStreamTag(value: unknown): value is StreamTag {
  return StreamEnum.includes(value as StreamTag);
}
