export type Milliseconds = number;

export interface CmdOptions {
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
}
