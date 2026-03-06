# @epdoc/progress

A reusable terminal progress indicator for Deno supporting four modes: spinner, bounce, horizontal progress bar, and vertical fill. Features configurable colors and fine-grained fractional progress display.

## Features

- **Four visual modes**:
  - **Spinner**: Looping animation for indeterminate progress
  - **Bounce**: Back-and-forth animation (e.g., bouncing ball or sliding gradient)
  - **Horizontal bar**: Determinate progress with configurable width
  - **Vertical fill**: Single-character vertical level indicator
- **Fine-grained progress**: 1/8 character resolution using partial block characters (▏▎▍▌▋▊▉)
- **Configurable colors**: Named colors or hex values for all modes
- **Non-intrusive**: Writes to stderr to avoid interfering with stdout output
- **Lightweight**: Minimal dependencies, simple API

## Installation

```bash
deno add jsr:@epdoc/progress
```

## Usage

### Spinner Mode

Animated spinner for indeterminate progress:

```typescript
import { ProgressLine } from '@epdoc/progress';

const progress = new ProgressLine({ type: 'spinner', index: 0, color: 'cyan' });
progress.start('Initializing...');
// ... do work ...
progress.update('Loading configuration...');
// ... do more work ...
progress.stop('Complete!');
```

**Spinner indices:**
- `0`: Braille dots (⠋⠙⠹⠸...)
- `1`: Braille wave (⠋⠙⠚⠞...)
- `2`: Block quadrants (▖▘▝▗...)

### Bounce Mode

Back-and-forth animation, useful for "thinking" indicators:

```typescript
import { ProgressLine } from '@epdoc/progress';

// Bouncing ball
const progress = new ProgressLine({ type: 'bounce', index: 0, color: 'magenta' });
progress.start('Deploying...');
await deploy();
progress.stop('Deployed!');

// Sliding gradient blocks (OpenCode-style thinking indicator)
const thinking = new ProgressLine({ type: 'bounce', index: 1, color: 'purple' });
thinking.start('Analyzing...');
await analyze();
thinking.stop('Analysis complete!');
```

**Bounce indices:**
- `0`: Parenthesized ball (● bounces left-right in `()`)
- `1`: Gradient trail (░▒▓█ sliding with density gradient)

### Horizontal Progress Bar Mode

Determinate progress bar with fine-grained fractional display:

```typescript
import { ProgressLine } from '@epdoc/progress';

const totalFiles = 20;
const progress = new ProgressLine({
  type: 'horizontal',
  total: totalFiles,
  width: 15,
  color: 'green'
});

progress.start('Downloading files...');

for (let i = 0; i <= totalFiles; i++) {
  progress.update(`Downloading file ${i}/${totalFiles}...`, i);
  // ... download file ...
}

progress.stop('All files downloaded!');
```

### Vertical Fill Mode

Single-character vertical level indicator:

```typescript
import { ProgressLine } from '@epdoc/progress';

const progress = new ProgressLine({ type: 'vertical', total: 100, color: 'blue' });
progress.start('Battery level');

for (let i = 0; i <= 100; i += 10) {
  progress.update(`Battery: ${i}%`, i);
  await delay(200);
}

progress.stop('Fully charged!');
```

### Fine-Grained Progress

The horizontal bar automatically shows fractional progress using partial block characters when progress increments are smaller than full characters:

```typescript
// With 40 total and 5-character width, each unit is 1/8 of a character
const progress = new ProgressLine({ type: 'horizontal', total: 40, width: 5 });
progress.start('Fine-grained progress...');

for (let i = 0; i <= 40; i++) {
  progress.update(`Progress: ${i}/40`, i);
  // Shows: ▏ ▎ ▍ ▌ ▋ ▊ ▉ █ as progress increases
}
```

### Mixed Modes

Use separate instances for different phases:

```typescript
// Spinner for connection
const spinner = new ProgressLine({ type: 'spinner', index: 0 });
spinner.start('Connecting...');
await connect();
spinner.stop('Connected!');

// Bounce for thinking phase
const bounce = new ProgressLine({ type: 'bounce', index: 1, color: 'purple' });
bounce.start('Analyzing...');
await analyze();
bounce.stop('Analysis complete!');

// Horizontal bar for download
const bar = new ProgressLine({ type: 'horizontal', total: 100, width: 20 });
bar.start('Downloading...');
for (let i = 0; i <= 100; i++) {
  bar.update(`Downloading ${i}%...`, i);
}
bar.stop('Download complete!');
```

## API Reference

### Types

#### `Color`

A color value as either a hex number or named string.

```typescript
type Color = number | string;
```

**Named colors:** `red`, `green`, `blue`, `yellow`, `cyan`, `magenta`, `white`, `black`, `orange`, `gray`, `grey`, `purple`

**Hex example:** `0x20D020` (green)

#### `ProgressLineOptions`

Configuration options passed to the constructor.

```typescript
type ProgressLineOptions =
  | { type: 'spinner'; index: 0 | 1 | 2; color?: Color }
  | { type: 'bounce'; index: 0 | 1; color?: Color }
  | { type: 'horizontal'; total: number; width: number; color?: Color }
  | { type: 'vertical'; total: number; color?: Color };
```

### Class: `ProgressLine`

#### Constructor

```typescript
constructor(options?: ProgressLineOptions)
```

Creates a new ProgressLine instance. Defaults to spinner mode with index 0.

**Parameters:**

| Name      | Type                  | Description                                                    |
|-----------|----------------------|----------------------------------------------------------------|
| `options` | `ProgressLineOptions`| Configuration for the indicator mode, style, and color        |

#### Methods

##### `start(message: string): void`

Start showing the progress indicator.

**Parameters:**

| Name      | Type     | Description                         |
|-----------|----------|-------------------------------------|
| `message` | `string` | The status message to display       |

##### `update(message: string, progress?: number): void`

Update the status message and/or progress value.

**Parameters:**

| Name        | Type     | Description                                                                    |
|-------------|----------|--------------------------------------------------------------------------------|
| `message`   | `string` | The new status message to display                                              |
| `progress?` | `number` | Current progress value (0 to total). Only used by horizontal and vertical modes. |

##### `stop(finalMessage?: string): void`

Stop the progress indicator and optionally display a final message.

**Parameters:**

| Name            | Type     | Description                                       |
|-----------------|----------|---------------------------------------------------|
| `finalMessage?` | `string` | Optional final message to display after clearing  |

### Type Guards

For runtime type checking:

```typescript
import { isSpinner, isBounce, isHorizontal, isVertical } from '@epdoc/progress';

if (isSpinner(options)) {
  // options is SpinnerOptions
}
```

## Visual Output Examples

### Spinner Mode

```
⠋ Initializing...
⠙ Loading configuration...
```

### Bounce Mode

**Index 0 (ball):**
```
(●     ) Connecting...
( ●    ) Connecting...
(  ●   ) Connecting...
```

**Index 1 (gradient trail):**
```
▒▓██···· Thinking...
░▒▓██··· Thinking...
·░▒▓██·· Thinking...
```

### Horizontal Progress Bar

```
█████░░░░░░░░░░ Downloading file 10/20...
████████████░░░ Processing 80%...
```

### Fine-Grained Progress

Partial blocks show when chunks exceed bar width:

```
▏     Progress: 1/40   (1/8 filled)
▌     Progress: 4/40   (4/8 filled)
█▋    Progress: 13/40  (1 + 5/8 filled)
███▉  Progress: 39/40  (3 + 7/8 filled)
```

### Vertical Fill

```
▂ Battery: 25%
▄ Battery: 50%
▆ Battery: 75%
█ Battery: 100%
```

## How Fine-Grained Progress Works

The horizontal bar uses Unicode partial block characters for 1/8 character resolution:

- **Full blocks** (`█`): Complete character-width progress
- **Partial blocks** (`▏▎▍▌▋▊▉`): 1/8 to 7/8 of a character width

This allows smooth progress indication even with many more chunks than bar characters.

## License

MIT
