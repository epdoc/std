export type Milliseconds = number;

export interface CmdOptions<T = unknown, E extends Error = Error> {
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
  outParser?: (result: ICmdResult) => T;
  errParser?: (result: ICmdResult) => E;
}

export interface ICmdResult {
  stdout: string;
  stderr: string;
  command: string;
  code?: number;
}
