/**
 * Interactive pager for displaying content with pagination.
 *
 * @module @epdoc/terminal/pager
 *
 * Provides "less"-like functionality for displaying large amounts of text
 * that don't fit on a single screen. Supports keyboard navigation including
 * space/Page Down for next page, Page Up for previous page, and q/Ctrl+C to quit.
 *
 * The pager automatically hides the cursor during display and restores it
 * on exit. It can show a status line with page numbers and navigation hints.
 *
 * @example
 * ```typescript
 * import { pager } from '@epdoc/terminal';
 *
 * const lines = generateLotsOfOutput();
 * const result = await pager.display(lines, {
 *   pageSize: 20,
 *   showStatus: true,
 *   prompt: 'Press space for more, q to quit'
 * });
 *
 * if (result.quit) {
 *   console.log('User quit early');
 * }
 * ```
 */

import { rgb24 } from '@std/fmt/colors';
import { isNextPage, isPreviousPage, isQuit, readKey } from './keys.ts';
import { clearScreen, getTerminalSize, hideCursor, newline, showCursor, writeSync } from './screen.ts';

/**
 * Options for configuring the pager behavior.
 */
export interface PagerOptions {
  /** Number of lines per page (default: terminal height - 2 for status line) */
  pageSize?: number;
  /** Show line numbers on the left (default: false) */
  showLineNumbers?: boolean;
  /** Show a status line at bottom with page info (default: true) */
  showStatus?: boolean;
  /** Custom prompt text shown in status line (default: "Press space for more, q to quit") */
  prompt?: string;
  /** Starting page index, 0-based (default: 0) */
  startPage?: number;
  /** Clear screen before displaying each page (default: true). When false, content scrolls naturally and status line is not shown on the last page. */
  clearScreen?: boolean;
  /** RGB color for the status line (default: 0x666666 - gray) */
  statusColor?: number;
}

/**
 * Result returned after pagination completes.
 */
export interface PagerResult {
  /** Whether the user quit before reaching the end */
  quit: boolean;
  /** Index of the last page that was displayed (0-based) */
  lastPage: number;
  /** Total number of pages in the content */
  totalPages: number;
}

/**
 * Display content with interactive pagination.
 *
 * @param lines - Array of lines to display
 * @param options - Pager options
 * @returns PagerResult with completion status
 *
 * @example
 * ```typescript
 * import { pager } from '@epdoc/terminal/pager';
 *
 * const lines = ['Line 1', 'Line 2', 'Line 3', ...];
 * const result = await pager.display(lines, { pageSize: 20 });
 *
 * if (result.quit) {
 *   console.log('User quit early');
 * }
 * ```
 */
export async function display(
  lines: string[],
  options: PagerOptions = {},
): Promise<PagerResult> {
  const {
    pageSize: customPageSize,
    showLineNumbers = false,
    showStatus = true,
    prompt = 'Press space for more, q to quit',
    startPage = 0,
    clearScreen: shouldClear = false,
    statusColor = 0x666666,
  } = options;

  // Determine page size
  const termSize = getTerminalSize();
  const reservedLines = showStatus ? 2 : 0;
  const pageSize = customPageSize ?? Math.max(5, termSize.rows - reservedLines);

  // Calculate total pages
  const totalPages = Math.ceil(lines.length / pageSize);
  let currentPage = Math.min(startPage, totalPages - 1);
  let quit = false;

  // Hide cursor for cleaner display
  hideCursor();

  try {
    while (currentPage < totalPages) {
      // Clear screen if requested (default behavior)
      if (shouldClear) {
        clearScreen();
      }

      // Display current page
      const startLine = currentPage * pageSize;
      const endLine = Math.min(startLine + pageSize, lines.length);

      for (let i = startLine; i < endLine; i++) {
        const line = lines[i];
        if (showLineNumbers) {
          const numStr = String(i + 1).padStart(4, ' ');
          writeSync(`${numStr}: ${line}\n`);
        } else {
          writeSync(`${line}\n`);
        }
      }

      // Show status line (skip on last page when not clearing screen)
      const isLastPage = currentPage >= totalPages - 1;
      if (showStatus && (shouldClear || !isLastPage)) {
        const statusText = `-- Page ${currentPage + 1}/${totalPages} (${lines.length} lines) -- ${prompt}`;
        const coloredStatus = rgb24(statusText, statusColor);
        newline();
        writeSync(coloredStatus);
      }

      // If this is the last page, we're done
      if (isLastPage) {
        if (shouldClear) {
          newline();
        }
        break;
      }

      // Wait for user input
      const key = await readKey();

      if (key === undefined) {
        // EOF or not a TTY, just continue to end
        currentPage++;
      } else if (isQuit(key)) {
        quit = true;
        break;
      } else if (isNextPage(key)) {
        currentPage++;
      } else if (isPreviousPage(key) && currentPage > 0) {
        currentPage--;
      }
      // Any other key continues to next page
    }
  } finally {
    showCursor();
  }

  return {
    quit,
    lastPage: currentPage,
    totalPages,
  };
}

/**
 * Simple non-interactive paginated display.
 * Shows content page by page with a delay, no user interaction.
 *
 * @param lines - Array of lines to display
 * @param options - Options including delay between pages
 */
export async function autoDisplay(
  lines: string[],
  options: {
    pageSize?: number;
    delayMs?: number;
    showStatus?: boolean;
    clearScreen?: boolean;
  } = {},
): Promise<void> {
  const {
    pageSize: customPageSize,
    delayMs = 3000,
    showStatus = true,
    clearScreen: shouldClear = true,
  } = options;

  const termSize = getTerminalSize();
  const reservedLines = showStatus ? 2 : 0;
  const pageSize = customPageSize ?? Math.max(5, termSize.rows - reservedLines);

  const totalPages = Math.ceil(lines.length / pageSize);

  hideCursor();

  try {
    for (let page = 0; page < totalPages; page++) {
      if (shouldClear) {
        clearScreen();
      }

      const startLine = page * pageSize;
      const endLine = Math.min(startLine + pageSize, lines.length);

      for (let i = startLine; i < endLine; i++) {
        writeSync(`${lines[i]}\n`);
      }

      if (showStatus) {
        newline();
        writeSync(`-- Page ${page + 1}/${totalPages} (${lines.length} lines) --`);
      }

      if (page < totalPages - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  } finally {
    showCursor();
    newline();
  }
}

/** Pager namespace with all functionality */
export const pager = {
  display,
  autoDisplay,
};
