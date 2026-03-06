import { _ } from '@epdoc/type';
import { rgb24 } from '@std/fmt/colors';

const encoder = new TextEncoder();
const blocks = {
  spinner: [
    ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
    ['⠋', '⠙', '⠚', '⠞', '⠖', '⠦', '⠴', '⠲', '⠳', '⠓'],
    ['▖', '▘', '▝', '▗', '▚', '▞', '█'],
  ],
  bounce: [
    [
      '(●     )',
      '( ●    )',
      '(  ●   )',
      '(   ●  )',
      '(    ● )',
      '(     ●)',
      '(    ● )',
      '(   ●  )',
      '(  ●   )',
      '( ●    )',
    ],
    [
      '········',
      '█·······',
      '██······',
      '▓██·····',
      '▒▓██····',
      '░▒▓██···',
      '·░▒▓██··',
      '··░▒▓██·',
      '···░▒▓██',
      '····░▒▓█',
      '·····░▒▓',
      '······░▒',
      '·······░',
      '········',
      '·······█',
      '······█▓',
      '·····█▓▒',
      '····█▓▒░',
      '···█▓▒░·',
      '··█▓▒░··',
      '·█▓▒░···',
      '█▓▒░····',
      '▓▒░·····',
      '▒░······',
      '░·······',
      '········',
    ],
  ],
  horizontal: ['', '▏', '▎', '▍', '▌', '▋', '▊', '▉'],
  vertical: [' ', '▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'],
} as const;
export type Mode = keyof typeof blocks;

const DEFAULT_COLOR = 0xD02020;

/**
 * A map of named colors to their hexadecimal RGB values.
 *
 * Use these names as the `color` option in {@link ProgressLineOptions} for
 * convenient color selection without specifying hex values directly.
 */
const colorMap: Record<string, number> = {
  red: 0xD02020,
  green: 0x20D020,
  blue: 0x2020D0,
  yellow: 0xD0D020,
  cyan: 0x20D0D0,
  magenta: 0xD020D0,
  white: 0xF0F0F0,
  black: 0x202020,
  orange: 0xD07020,
  gray: 0x808080,
  grey: 0x808080,
  purple: 0x8020D0,
};

/**
 * A color value specified as either a hex number (e.g. `0xD02020`) or a named
 * color string (e.g. `'red'`, `'green'`, `'cyan'`).
 *
 * Supported named colors: `red`, `green`, `blue`, `yellow`, `cyan`, `magenta`,
 * `white`, `black`, `orange`, `gray`/`grey`, `purple`.
 */
export type Color = number | string;

/**
 * Resolve a {@link Color} value to a numeric hex value for use with `rgb24()`.
 * Returns {@link DEFAULT_COLOR} if the value is undefined or unrecognized.
 */
function resolveColor(color: Color | undefined): number {
  if (_.isUndefined(color)) {
    return DEFAULT_COLOR;
  }
  if (_.isNumber(color)) {
    return color;
  }
  if (_.isString(color)) {
    return colorMap[color.toLowerCase()] ?? DEFAULT_COLOR;
  }
  return DEFAULT_COLOR;
}

/**
 * Base options shared by all progress line modes.
 */
type BaseOptions = {
  /** The display color for the progress indicator. Defaults to red (`0xD02020`). */
  color?: Color;
};

export type SpinnerOptions = BaseOptions & { type: 'spinner'; index: 0 | 1 | 2 };
export type BounceOptions = BaseOptions & { type: 'bounce'; index: 0 | 1 };
export type HorizontalOptions = BaseOptions & { type: 'horizontal'; total: number; width: number };
export type VerticalOptions = BaseOptions & { type: 'vertical'; total: number };

export type ProgressLineOptions = SpinnerOptions | BounceOptions | HorizontalOptions | VerticalOptions;

export function isSpinner(val: unknown): val is SpinnerOptions {
  return _.isDict(val) && val.type === 'spinner' && _.isIntegerInRange(val.index, 0, blocks.spinner.length - 1);
}
export function isBounce(val: unknown): val is BounceOptions {
  return _.isDict(val) && val.type === 'bounce' && _.isIntegerInRange(val.index, 0, blocks.bounce.length - 1);
}
export function isHorizontal(val: unknown): val is HorizontalOptions {
  return _.isDict(val) && val.type === 'horizontal' && _.isNumber(val.total) && _.isPosInteger(val.width);
}
export function isVertical(val: unknown): val is VerticalOptions {
  return _.isDict(val) && val.type === 'vertical' && _.isNumber(val.total);
}

/**
 * A reusable terminal progress indicator that supports spinner, bounce,
 * horizontal progress bar, and vertical fill modes.
 *
 * This class provides visual feedback for long-running operations in terminal
 * applications. It supports four modes:
 * - **Spinner mode**: Looping character animation for indeterminate progress
 * - **Bounce mode**: Back-and-forth animation for indeterminate progress
 *   (e.g. bouncing ball or sliding block indicator)
 * - **Horizontal bar mode**: For determinate progress with fine-grained
 *   fractional display using partial block characters
 * - **Vertical fill mode**: For single-character vertical fill display
 *
 * All output is written to stderr to avoid interfering with stdout data. The
 * display color is configurable via the `color` option and defaults to red.
 * The indicator automatically clears itself when stopped.
 *
 * @example Spinner mode for unknown duration tasks
 * ```ts
 * const progress = new ProgressLine({ type: 'spinner', index: 0, color: 'cyan' });
 * progress.start('Connecting to server...');
 * await connectToServer();
 * progress.stop('Connected!');
 * ```
 *
 * @example Bounce mode for thinking/waiting indicators
 * ```ts
 * const progress = new ProgressLine({ type: 'bounce', index: 1, color: 'purple' });
 * progress.start('Thinking...');
 * await processRequest();
 * progress.stop('Done!');
 * ```
 *
 * @example Horizontal progress bar for known amount of work
 * ```ts
 * const totalFiles = 20;
 * const progress = new ProgressLine({ type: 'horizontal', total: totalFiles, width: 15, color: 0x20D020 });
 * progress.start('Downloading files...');
 * for (let i = 0; i <= totalFiles; i++) {
 *   progress.update(`Downloading file ${i}/${totalFiles}...`, i);
 *   await downloadFile(i);
 * }
 * progress.stop('Download complete!');
 * ```
 *
 * @example Vertical fill indicator
 * ```ts
 * const progress = new ProgressLine({ type: 'vertical', total: 100, color: 'green' });
 * progress.start('Volume level');
 * for (let i = 0; i <= 100; i++) {
 *   progress.update(`Volume: ${i}%`, i);
 * }
 * progress.stop('Done!');
 * ```
 */
export class ProgressLine {
  #intervalId?: number;
  #frameIndex = 0;
  #currentMessage = '';
  #isActive = false;
  #currentProgress = 0;
  #options: ProgressLineOptions = { type: 'spinner', index: 0 };
  #color: number;

  constructor(options: ProgressLineOptions = { type: 'spinner', index: 0 }) {
    this.#options = options;
    this.#color = resolveColor(options.color);
    if (options.type === 'horizontal') {
      if (!options.total) options.total = 1;
      if (!options.width) options.width = 10;
    } else if (options.type === 'vertical') {
      if (!options.total) options.total = 1;
    }
  }

  /**
   * Start showing the progress indicator.
   *
   * If the progress line is already active, it will be stopped and restarted.
   * In spinner and bounce modes, an animation interval is started that cycles
   * through frames every 80ms.
   *
   * Visual options (total, width, color) are configured exclusively through the
   * constructor. Use separate {@link ProgressLine} instances for different modes.
   *
   * @param message - The status message to display next to the indicator
   *
   * @example
   * ```ts
   * const spinner = new ProgressLine({ type: 'spinner', index: 0 });
   * spinner.start('Loading...');
   *
   * const bouncer = new ProgressLine({ type: 'bounce', index: 1, color: 'purple' });
   * bouncer.start('Thinking...');
   *
   * const bar = new ProgressLine({ type: 'horizontal', total: 100, width: 20 });
   * bar.start('Processing...');
   * ```
   */
  start(message: string): void {
    if (this.#isActive) {
      this.stop();
    }

    this.#currentProgress = 0;
    this.#isActive = true;
    this.#currentMessage = message;
    this.#frameIndex = 0;

    // Show initial frame
    this.render();

    // Start animation for spinner and bounce modes
    if (isSpinner(this.#options)) {
      const len = blocks.spinner[this.#options.index].length;
      this.#intervalId = setInterval(() => {
        this.#frameIndex = (this.#frameIndex + 1) % len;
        this.render();
      }, 80);
    } else if (isBounce(this.#options)) {
      const len = blocks.bounce[this.#options.index].length;
      this.#intervalId = setInterval(() => {
        this.#frameIndex = (this.#frameIndex + 1) % len;
        this.render();
      }, 80);
    }
  }

  /**
   * Update the status message and/or progress value.
   *
   * In horizontal bar mode, the progress value is used to calculate the visual
   * fill level. When the number of total units exceeds the bar width, partial
   * block characters (▏▎▍▌▋▊▉) are used to show fractional progress at 1/8
   * character resolution.
   *
   * In vertical fill mode, the progress value maps to one of nine vertical
   * block characters (▁▂▃▄▅▆▇█) representing fill level.
   *
   * @param message - The new status message to display
   * @param [progress] - Current progress value. This value is divided by the
   *   total and used to determine the visual fill level. Only applies to
   *   horizontal and vertical modes.
   *
   * @example
   * ```ts
   * const progress = new ProgressLine({ type: 'horizontal', total: 100, width: 20 });
   * progress.start('Downloading...');
   *
   * // Update message only
   * progress.update('Still downloading...');
   *
   * // Update both message and progress
   * progress.update('Downloading 50%...', 50);
   * ```
   */
  update(message: string, progress?: number): void {
    if (!this.#isActive) {
      return;
    }
    this.#currentMessage = message;
    if (progress !== undefined) {
      this.#currentProgress = progress;
    }
    this.render();
  }

  /**
   * Stop the progress indicator and optionally display a final message.
   *
   * This method clears the current line (removing the spinner or progress bar)
   * and optionally writes a final message to stderr. If no message is provided,
   * the line is simply cleared without any output.
   *
   * Any active animation interval is stopped when this method is called.
   *
   * @param [finalMessage] - Optional final message to display. The progress
   *   indicator is cleared before this message is shown.
   *
   * @example
   * ```ts
   * const progress = new ProgressLine({ type: 'spinner', index: 0 });
   * progress.start('Working...');
   * // ... do work ...
   *
   * // Stop without a message
   * progress.stop();
   *
   * // Or stop with a completion message
   * progress.stop('All tasks completed!');
   * ```
   */
  stop(finalMessage?: string): void {
    if (!this.#isActive) {
      return;
    }

    if (this.#intervalId !== undefined) {
      clearInterval(this.#intervalId);
      this.#intervalId = undefined;
    }

    this.#isActive = false;

    // Clear the line
    this.clearLine();

    // Show final message if provided (without progress bar or spinner)
    if (finalMessage) {
      const output = `${finalMessage}\n`;
      Deno.stderr.writeSync(encoder.encode(output));
    }
  }

  /**
   * Render the current frame to stderr.
   *
   * In spinner and bounce modes, displays the current frame character with the
   * message. In horizontal bar mode, calculates and displays the filled portion
   * of the bar using full blocks (█), partial blocks (▏▎▍▌▋▊▉) for fractional
   * progress, and uncolored empty blocks (░) for the remaining space. In
   * vertical fill mode, displays a single block character at the appropriate
   * fill level.
   *
   * @private
   */
  private render(): void {
    if (!this.#isActive) {
      return;
    }

    let output: string = '';
    const color = this.#color;

    const opts = this.#options;
    if (isSpinner(opts)) {
      const frame = blocks.spinner[opts.index][this.#frameIndex];
      output = `\r\x1b[K${rgb24(frame, color)} ${this.#currentMessage}`;
    } else if (isBounce(opts)) {
      const frame = blocks.bounce[opts.index][this.#frameIndex];
      output = `\r\x1b[K${rgb24(frame, color)} ${this.#currentMessage}`;
    } else if (isHorizontal(opts)) {
      // Calculate fractional progress, clamped to [0, width]
      const exactProgress = Math.min(opts.width, Math.max(0, (this.#currentProgress / opts.total) * opts.width));
      const fullBlocks = Math.floor(exactProgress);
      const remainder = exactProgress - fullBlocks;

      // Calculate partial block (0-7 representing 0/8 to 7/8)
      const partialIndex = Math.floor(remainder * 8);
      const partialBlock = blocks.horizontal[partialIndex];

      // Calculate remaining empty space
      const usedChars = fullBlocks + (partialBlock ? 1 : 0);
      const emptyCount = Math.max(0, opts.width - usedChars);

      // Build the bar: colored filled portion + empty spaces
      const filled = '█'.repeat(fullBlocks) + partialBlock;
      const empty = ' '.repeat(emptyCount);
      output = `\r\x1b[K${rgb24(filled, color)}${empty} ${this.#currentMessage}`;
    } else if (isVertical(opts)) {
      // Calculate vertical fill level (0-8 for the 9 block characters), clamped
      const exactProgress = Math.min(8, Math.max(0, (this.#currentProgress / opts.total) * 8));
      const blockIndex = Math.floor(exactProgress);
      const bar = blocks.vertical[blockIndex];
      output = `\r\x1b[K${rgb24(bar, color)} ${this.#currentMessage}`;
    }

    Deno.stderr.writeSync(encoder.encode(output));
  }

  /**
   * Clear the current line on stderr.
   *
   * Uses ANSI escape codes to clear from the cursor position to the end
   * of the line, effectively removing the progress indicator.
   *
   * @private
   */
  private clearLine(): void {
    Deno.stderr.writeSync(encoder.encode('\r\x1b[K'));
  }
}
