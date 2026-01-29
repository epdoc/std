/**
 * A mapping of conflict strategy types to their string representations.
 */
export const fileConflictStrategyType = {
  renameWithTilde: 'renameWithTilde',
  renameWithNumber: 'renameWithNumber',
  renameWithDatetime: 'renameWithDatetime',
  renameWithEpochMs: 'renameWithEpochMs',
  overwrite: 'overwrite',
  skip: 'skip',
  error: 'error',
} as const;
