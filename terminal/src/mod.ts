/**
 * Terminal utilities for CLI applications.
 *
 * Provides screen control, cursor manipulation, key input handling,
 * and interactive pagination.
 *
 * @example
 * ```typescript
 * import { pager, screen, keys } from '@epdoc/terminal';
 *
 * // Use the pager for table output
 * const lines = table.render();
 * await pager.display(lines, { pageSize: 20 });
 *
 * // Screen utilities
 * screen.clearScreen();
 * const { columns, rows } = screen.getTerminalSize();
 *
 * // Key input
 * const key = await keys.readKey();
 * if (keys.isQuit(key)) { ... }
 * ```
 */

// Re-export from submodules
export * from './keys.ts';
export * from './pager.ts';
export * from './screen.ts';

// Namespace imports for convenience
import * as keysModule from './keys.ts';
import * as pagerModule from './pager.ts';
import * as screenModule from './screen.ts';

/** Keys namespace for key input handling */
export const keys = keysModule;

/** Pager namespace for pagination */
export const pager = pagerModule;

/** Screen namespace for terminal control */
export const screen = screenModule;

export * from './utils.ts';
