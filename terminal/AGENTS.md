# AGENTS.md — @epdoc/terminal

This file provides project-specific context for AI agents working on the `@epdoc/terminal` package.

## Package Purpose

`@epdoc/terminal` provides terminal control utilities for CLI applications, including screen manipulation, cursor control, key input handling, and interactive pagination.

## Package Dependencies

This package depends on:

- `@std/fmt` — For ANSI color utilities (`rgb24` used in pager status line)

## Development Guidelines

Follow the universal Deno project conventions from the root monorepo's AGENTS.md.

### Key Patterns

See source files for usage patterns:

- **screen.ts** - Terminal screen/cursor control (`clearScreen`, `moveTo`, `hideCursor`, etc.)
- **keys.ts** - Key input constants (`Keys.SPACE`, `Keys.UP`) and reading (`readKey`)
- **pager.ts** - Interactive pagination (`display`, `autoDisplay`)

### Source Organization

```
src/
  mod.ts       - Public exports with namespaced imports (keys, pager, screen)
  screen.ts    - Terminal screen utilities (clear, cursor, ANSI helpers)
  keys.ts      - Key codes and input handling
  pager.ts     - Interactive pagination with less-like functionality
```

### Public API

#### Screen utilities (`screen` namespace)

```typescript
import { screen } from '@epdoc/terminal';

// Terminal info
screen.getTerminalSize(): TerminalSize  // { columns, rows }

// Screen control
screen.clearScreen(): void
screen.clearLine(): void
screen.clearEntireLine(): void

// Cursor movement
screen.moveTo(row, col): void
screen.moveUp(lines): void
screen.moveDown(lines): void
screen.moveToLineStart(): void
screen.hideCursor(): void
screen.showCursor(): void

// Output
screen.writeSync(str): void
screen.write(str): Promise<void>
screen.newline(count): void

// ANSI utilities
screen.stripAnsi(str): string
screen.visualLength(str): number
screen.visualTruncate(str, maxWidth): string
screen.padVisual(str, width, align, char): string
```

#### Key input (`keys` namespace)

```typescript
import { keys, Keys } from '@epdoc/terminal';

// Key constants
Keys.SPACE, Keys.ENTER, Keys.ESC
Keys.UP, Keys.DOWN, Keys.LEFT, Keys.RIGHT
Keys.PAGE_UP, Keys.PAGE_DOWN
Keys.CTRL_C, Keys.CTRL_D

// Key reading
const key = await keys.readKey();

// Key checking
keys.isQuit(key): boolean      // q, Q, Ctrl+C
keys.isNextPage(key): boolean  // space, Page Down
keys.isPreviousPage(key): boolean // Page Up
```

#### Pager (`pager` namespace)

```typescript
import { pager } from '@epdoc/terminal';

// Interactive pagination (space=next, q=quit, Page Up/Down)
const result = await pager.display(lines, {
  pageSize: 20,           // Lines per page (default: terminal height - 2)
  showLineNumbers: false,
  showStatus: true,
  prompt: 'Press space for more, q to quit',
  startPage: 0,
  clearScreen: true,
  statusColor: 0x666666,
});
// Returns: { quit: boolean, lastPage: number, totalPages: number }

// Auto-display with delay (no interaction)
await pager.autoDisplay(lines, {
  pageSize: 20,
  delayMs: 3000,
  showStatus: true,
  clearScreen: true,
});
```

### Testing

Run tests with:

```bash
deno test -SERW
```

### Publishing

Before publishing:

```bash
deno task prepublish
```

This runs formatting, linting, type checking, tests, and documentation generation.

## Notes

- All screen functions use `Deno.stdout.writeSync()` for immediate output
- `readKey()` requires a TTY and uses raw mode (automatically set/unset)
- Non-TTY environments return safe defaults (80x24 terminal size, undefined keys)
- The pager handles cursor visibility (hides during display, restores on exit)
