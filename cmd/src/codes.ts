export interface ExitCodeInfo {
  category: 'Success' | 'Standard' | 'Signal' | 'SysExits';
  description: string;
}

export const EXIT_CODES: ReadonlyMap<number, ExitCodeInfo> = new Map([
  // --- General & Standard POSIX Codes ---
  [0, { category: 'Success', description: 'Success / Normal termination' }],
  [1, { category: 'Standard', description: 'General error / Catch-all' }],
  [2, { category: 'Standard', description: 'Misuse of shell built-ins or invalid command-line syntax' }],
  [126, { category: 'Standard', description: 'Command found but not executable (permission denied)' }],
  [127, { category: 'Standard', description: 'Command not found in PATH' }],
  [128, { category: 'Standard', description: 'Invalid exit status argument' }],
  [255, { category: 'Standard', description: 'Exit status out of range (outside 0-255)' }],

  // --- Common OS Signals (128 + Signal Number) ---
  [129, { category: 'Signal', description: 'SIGHUP (Hangup detected on controlling terminal)' }],
  [130, { category: 'Signal', description: 'SIGINT (Terminated by user control-C)' }],
  [131, { category: 'Signal', description: 'SIGQUIT (Quit signal with core dump)' }],
  [132, { category: 'Signal', description: 'SIGILL (Illegal instruction)' }],
  [134, { category: 'Signal', description: 'SIGABRT (Aborted by process)' }],
  [136, { category: 'Signal', description: 'SIGFPE (Floating-point exception)' }],
  [137, { category: 'Signal', description: 'SIGKILL (Killed unconditionally, e.g. OOM killer)' }],
  [139, { category: 'Signal', description: 'SIGSEGV (Segmentation fault / Invalid memory reference)' }],
  [141, { category: 'Signal', description: 'SIGPIPE (Broken pipe: wrote to pipe with no reader)' }],
  [143, { category: 'Signal', description: 'SIGTERM (Termination request sent)' }],

  // --- Standard C/C++ <sysexits.h> Codes ---
  [64, { category: 'SysExits', description: 'EX_USAGE (Command-line parameter syntax error)' }],
  [65, { category: 'SysExits', description: 'EX_DATAERR (Input data incorrectly formatted)' }],
  [66, { category: 'SysExits', description: 'EX_NOINPUT (Input file does not exist or is unreadable)' }],
  [67, { category: 'SysExits', description: 'EX_NOUSER (User specified does not exist)' }],
  [68, { category: 'SysExits', description: 'EX_NOHOST (Host specified does not exist)' }],
  [69, { category: 'SysExits', description: 'EX_UNAVAILABLE (Required service or dependency unavailable)' }],
  [70, { category: 'SysExits', description: 'EX_SOFTWARE (Internal software error)' }],
  [71, { category: 'SysExits', description: 'EX_OSERR (System error, e.g., cannot fork process)' }],
  [72, { category: 'SysExits', description: 'EX_OSFILE (Critical system file missing or corrupted)' }],
  [73, { category: 'SysExits', description: 'EX_CANTCREAT (Output file cannot be created)' }],
  [74, { category: 'SysExits', description: 'EX_IOERR (I/O error while reading/writing file)' }],
  [75, { category: 'SysExits', description: 'EX_TEMPFAIL (Temporary failure; retry later)' }],
  [76, { category: 'SysExits', description: 'EX_PROTOCOL (Protocol exchange error)' }],
  [77, { category: 'SysExits', description: 'EX_NOPERM (Insufficient permission)' }],
  [78, { category: 'SysExits', description: 'EX_CONFIG (Configuration error)' }],
]);

export function getExitCodeDescription(code: number): string {
  const match = EXIT_CODES.get(code);
  if (match) return match.description;

  if (code > 128 && code <= 165) {
    return `Terminated by OS signal ${code - 128}`;
  }

  return 'Unknown or application-defined exit code';
}
