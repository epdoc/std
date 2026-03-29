# @epdoc/terminal

Terminal control utilities for CLI applications. Provides screen manipulation, cursor control, key input handling, and interactive pagination.

## Installation

```bash
deno add jsr:@epdoc/terminal
```

## Usage

### Screen Control

```typescript
import { screen } from '@epdoc/terminal';

// Get terminal dimensions
const { columns, rows } = screen.getTerminalSize();

// Clear and position cursor
screen.clearScreen();
screen.moveTo(1, 1);
screen.hideCursor();

// Output with ANSI support
screen.writeSync('Hello World');
screen.newline(2);

// Restore cursor
screen.showCursor();

// ANSI-aware string utilities
const visibleLength = screen.visualLength('\x1b[31mred\x1b[0m text'); // 9 (strips ANSI)
const padded = screen.padVisual('hello', 10, 'center');
const truncated = screen.visualTruncate(longText, columns);
```

### Key Input

```typescript
import { keys, Keys } from '@epdoc/terminal';

// Read a keypress (requires TTY)
const key = await keys.readKey();

if (key === Keys.SPACE) {
  console.log('Space pressed');
} else if (keys.isQuit(key)) {
  console.log('Quit command');
} else if (keys.isNextPage(key)) {
  console.log('Next page');
}
```

Available key constants: `SPACE`, `ENTER`, `ESC`, `UP`, `DOWN`, `LEFT`, `RIGHT`, `PAGE_UP`, `PAGE_DOWN`, `CTRL_C`, `CTRL_D`, `BACKSPACE`, `DELETE`, `TAB`, `HOME`, `END`

### Interactive Pager

```typescript
import { pager } from '@epdoc/terminal';

// Display content with pagination
const lines = generateLotsOfOutput();

const result = await pager.display(lines, {
  pageSize: 20,                    // Lines per page
  showLineNumbers: false,          // Show line numbers
  showStatus: true,                // Show page indicator
  prompt: 'Press space for more, q to quit',
  startPage: 0,
  clearScreen: true,               // Clear before display
  statusColor: 0x666666,          // Hex color for status bar
});

// Returns: { quit: boolean, lastPage: number, totalPages: number }
```

Navigation: `Space` or `Page Down` for next page, `Page Up` for previous, `q` or `Ctrl+C` to quit.

### Auto-Display (No Interaction)

```typescript
await pager.autoDisplay(lines, {
  pageSize: 20,
  delayMs: 3000,    // Wait 3 seconds between pages
  showStatus: true,
});
```

## Exports

- `.` - All namespaces (screen, keys, pager, Keys)
- `./screen` - Screen and cursor utilities only
- `./keys` - Key codes and input handling only
- `./pager` - Interactive pagination only

## API Reference

### screen namespace

- `getTerminalSize(): TerminalSize` - Get terminal dimensions
- `clearScreen()` - Clear entire screen
- `clearLine()` - Clear from cursor to end of line
- `clearEntireLine()` - Clear entire current line
- `moveTo(row, col)` - Move cursor to position
- `moveUp(lines)`, `moveDown(lines)` - Relative movement
- `moveToLineStart()` - Move to start of line
- `hideCursor()`, `showCursor()` - Cursor visibility
- `writeSync(str)`, `write(str)` - Output to terminal
- `newline(count?)` - Output newlines
- `stripAnsi(str)` - Remove ANSI codes
- `visualLength(str)` - Visible character count
- `visualTruncate(str, maxWidth)` - Truncate preserving ANSI
- `padVisual(str, width, align?, char?)` - Pad to width

### keys namespace

- `readKey(): Promise<string | undefined>` - Read single keypress
- `isQuit(key): boolean` - Check for q/Q/Ctrl+C
- `isNextPage(key): boolean` - Check for space/Page Down
- `isPreviousPage(key): boolean` - Check for Page Up

### Keys constants

Key codes as string literals: `SPACE`, `ENTER`, `NEWLINE`, `ESC`, `CTRL_C`, `CTRL_D`, `CTRL_R`, `BACKSPACE`, `DELETE`, `TAB`, `UP`, `DOWN`, `LEFT`, `RIGHT`, `PAGE_UP`, `PAGE_DOWN`, `HOME`, `END`, `Q`, `Q_UPPER`

### pager namespace

- `display(lines, options?): Promise<PagerResult>` - Interactive pagination
- `autoDisplay(lines, options?): Promise<void>` - Auto-advance pagination

## Development

```bash
# Run tests
deno task test

# Check and lint
deno task prepublish
```

## License

MIT
