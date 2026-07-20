export type Milliseconds = number;

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
}

export interface ICmdResult {
  stdout: string;
  stderr: string;
  command: string;
  code?: number;
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
