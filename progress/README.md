# @epdoc/progress

A reusable terminal progress indicator for Deno that supports both spinner and progress bar modes with fine-grained
fractional progress display.

## Features

- **Spinner mode**: Animated spinner for indeterminate progress when the total amount of work is unknown
- **Progress bar mode**: Visual progress bar with configurable width for determinate progress
- **Fine-grained progress**: 1/8 character resolution using partial block characters (▏▎▍▌▋▊▉)
- **Non-intrusive**: Writes to stderr to avoid interfering with stdout output
- **Colored output**: Red progress indicators for high visibility
- **Lightweight**: Minimal dependencies, simple and intuitive API

## Installation

```bash
deno add jsr:@epdoc/progress
```

## Usage

### Spinner Mode

Use spinner mode when you don't know the total amount of work or the duration is indeterminate:

```typescript
import { ProgressLine } from '@epdoc/progress';

const progress = new ProgressLine();

progress.start('Initializing...');
// ... do work ...
progress.update('Loading configuration...');
// ... do more work ...
progress.stop('Complete!');
```

### Progress Bar Mode

Use progress bar mode when you know the total amount of work:

```typescript
import { ProgressLine } from '@epdoc/progress';

const progress = new ProgressLine();
const totalFiles = 20;

// Start with default 10-character width
progress.start(`Downloading ${totalFiles} files...`, totalFiles);

for (let i = 0; i <= totalFiles; i++) {
  progress.update(`Downloading file ${i}/${totalFiles}...`, i);
  // ... download file ...
}

progress.stop('All files downloaded!');
```

### Custom Progress Bar Width

Specify a custom width for the progress bar:

```typescript
// 20-character wide progress bar
progress.start('Processing...', 100, 20);

for (let i = 0; i <= 100; i++) {
  progress.update(`Processing ${i}%...`, i);
}

progress.stop('Done!');
```

### Fine-Grained Progress

The progress bar automatically shows fractional progress using partial block characters when the number of chunks
exceeds the bar width:

```typescript
// With 40 chunks and 5-character width, each character represents 8 chunks
// You'll see partial blocks: ▏▎▍▌▋▊▉ as progress increases
progress.start('Fine-grained progress...', 40, 5);

for (let i = 0; i <= 40; i++) {
  progress.update(`Progress: ${i}/40`, i);
}
```

### Mixed Modes

Switch between spinner and progress bar modes for different phases of an operation:

```typescript
const progress = new ProgressLine();

// Spinner for connection phase
progress.start('Connecting to server...');
await connect();
progress.stop('Connected!');

// Progress bar for download phase
progress.start('Downloading...', 100, 15);
for (let i = 0; i <= 100; i++) {
  progress.update(`Downloading ${i}%...`, i);
  await delay(50);
}
progress.stop('Download complete!');

// Back to spinner for installation phase
progress.start('Installing package...');
await install();
progress.stop('Installation complete!');
```

## API Reference

### Class: `ProgressLine`

A reusable terminal progress indicator supporting both spinner and progress bar modes.

#### Constructor

```typescript
constructor();
```

Creates a new ProgressLine instance. No configuration is required at construction time.

#### Methods

##### `start(message, chunks?, width?)`

Start showing the progress indicator.

**Parameters:**

| Name      | Type     | Description                                                                                                  |
| --------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| `message` | `string` | The status message to display                                                                                |
| `chunks?` | `number` | Total number of items to process. When provided, enables progress bar mode. When omitted, uses spinner mode. |
| `width?`  | `number` | Width of the progress bar in characters. **Default:** `10`. Only applies when `chunks` is provided.          |

**Example:**

```typescript
const progress = new ProgressLine();

// Spinner mode
progress.start('Loading...');

// Progress bar mode with default width
progress.start('Downloading...', 20);

// Progress bar mode with custom width
progress.start('Processing...', 100, 20);
```

##### `update(message, progress?)`

Update the status message and/or progress value.

**Parameters:**

| Name        | Type     | Description                                                                                                                                                                        |
| ----------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `message`   | `string` | The new status message to display                                                                                                                                                  |
| `progress?` | `number` | Current progress value in chunks. The progress value is divided by total chunks and multiplied by bar width to determine the visual fill level. Only applies to progress bar mode. |

**Example:**

```typescript
// Update message only (common in spinner mode)
progress.update('Still working...');

// Update both message and progress (progress bar mode)
progress.update('Processing 50%...', 50);
```

##### `stop(finalMessage?)`

Stop the progress indicator and optionally display a final message.

Clears the current line (removing the spinner or progress bar) before displaying the final message. Any active animation
interval is stopped.

**Parameters:**

| Name            | Type     | Description                                                                                        |
| --------------- | -------- | -------------------------------------------------------------------------------------------------- |
| `finalMessage?` | `string` | Optional final message to display. The progress indicator is cleared before this message is shown. |

**Example:**

```typescript
// Stop without a message
progress.stop();

// Stop with a completion message
progress.stop('All tasks completed successfully!');
```

## Visual Output Examples

### Spinner Mode

```
⠋ Initializing...
⠙ Loading configuration...
```

### Progress Bar Mode

```
█████░░░░░ Downloading file 10/20...
████████░░ Processing 80%...
```

### Fine-Grained Progress

When chunks exceed bar width, partial block characters show fractional progress:

```
▏░░░░ Progress: 1/40    (1/8 filled)
▌░░░░ Progress: 4/40    (4/8 = 1/2 filled)
█▋░░░ Progress: 13/40   (1 + 5/8 filled)
████▉ Progress: 39/40   (4 + 7/8 filled)
```

## How Fine-Grained Progress Works

The progress bar uses Unicode partial block characters to display progress at 1/8 character resolution:

- **Full blocks** (`█`): Complete character-width progress
- **Partial blocks** (`▏▎▍▌▋▊▉`): 1/8 to 7/8 of a character width
- **Empty blocks** (`░`): Remaining unfilled space

This allows smooth progress indication even when you have many more chunks than bar characters. For example, with a
5-character bar and 40 chunks, each chunk represents 1/8 of a character, enabling very fine-grained visual feedback.

## License

MIT
