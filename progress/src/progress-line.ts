import { _ } from '@epdoc/type';
import { rgb24 } from '@std/fmt/colors';

const encoder = new TextEncoder();
const blocks = {
  spinner: [
    ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
    ['⠋', '⠙', '⠚', '⠞', '⠖', '⠦', '⠴', '⠲', '⠳', '⠓'],
    ['▖', '▘', '▝', '▗', '▚', '▞', '█'],
    ['(●     )', '( ●    )', '(  ●   )', '(   ●  )', '(    ● )', '(     ●)'],
  ],
  horizontal: ['', '▏', '▎', '▍', '▌', '▋', '▊', '▉'],
  vertical: [' ', ' ', '▂', '▃', '▄', '▅', '▆', '▇', '█'],
} as const;
export type Mode = keyof typeof blocks;

export type SpinnerOptions = { type: 'spinner'; index: 0 | 1 | 2 | 3 };
export type HorizontalOptions = { type: 'horizontal'; total: number; width: number };
export type VerticalOptions = { type: 'vertical'; total: number };

export type ProgressLineOptions = SpinnerOptions | HorizontalOptions | VerticalOptions;

export function isSpinner(val: unknown): val is SpinnerOptions {
  return _.isDict(val) && val.type === 'spinner' && _.isIntegerInRange(val.index, 0, blocks.spinner.length - 1);
}
export function isHorizontal(val: unknown): val is HorizontalOptions {
  return _.isDict(val) && val.type === 'horizontal' && _.isNumber(val.total) && _.isPosInteger(val.width);
}
export function isVertical(val: unknown): val is VerticalOptions {
  return _.isDict(val) && val.type === 'vertical' && _.isNumber(val.total);
}

/**
 * A reusable terminal progress indicator that supports both spinner and progress bar modes.
 *
 * This class provides visual feedback for long-running operations in terminal applications.
 * It supports two modes:
 * - **Spinner mode**: For indeterminate progress (when total work is unknown)
 * - **Progress bar mode**: For determinate progress with fine-grained fractional display
 *
 * All output is written to stderr to avoid interfering with stdout data. The progress
 * indicator uses red-colored output for visibility and automatically clears itself when stopped.
 *
 * @example Spinner mode for unknown duration tasks
 * ```ts
 * const progress = new ProgressLine();
 * progress.start('Connecting to server...');
 * await connectToServer();
 * progress.stop('Connected!');
 * ```
 *
 * @example Progress bar mode for known amount of work
 * ```ts
 * const progress = new ProgressLine();
 * const totalFiles = 20;
 * progress.start('Downloading files...', totalFiles);
 * for (let i = 0; i <= totalFiles; i++) {
 *   progress.update(`Downloading file ${i}/${totalFiles}...`, i);
 *   await downloadFile(i);
 * }
 * progress.stop('Download complete!');
 * ```
 *
 * @example Fine-grained progress with custom width
 * ```ts
 * const progress = new ProgressLine();
 * // 20-character wide bar with 100 chunks shows 1/8 character resolution
 * progress.start('Processing...', 100, 20);
 * for (let i = 0; i <= 100; i++) {
 *   progress.update(`Processing ${i}%...`, i);
 * }
 * progress.stop('Done!');
 * ```
 */
export class ProgressLine {
  #intervalId?: number;
  #frameIndex = 0;
  #currentMessage = '';
  #isActive = false;
  // #chunks: number = 1;
  // #barWidth = 10;
  #currentProgress = 0;
  // #useSpinner = true;
  #options: ProgressLineOptions = { type: 'spinner', index: 0 };

  constructor(options: ProgressLineOptions = { type: 'spinner', index: 0 }) {
    this.#options = options;
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
   * If the progress line is already active, it will be stopped and restarted
   * with the new parameters. In spinner mode, an animation interval is started
   * that cycles through spinner frames every 80ms.
   *
   * @param message - The status message to display next to the spinner or progress bar
   * @param [chunks] - Total number of items to process. When provided, enables
   *   progress bar mode with fractional display. When omitted, uses spinner mode.
   * @param [width=10] - Width of the progress bar in characters. Only applies
   *   when chunks is provided. Defaults to 10 characters.
   *
   * @example
   * ```ts
   * const progress = new ProgressLine();
   *
   * // Spinner mode (no chunks)
   * progress.start('Loading...');
   *
   * // Progress bar mode (20 chunks, default 10-char width)
   * progress.start('Downloading...', 20);
   *
   * // Progress bar with custom width (100 chunks, 20-char width)
   * progress.start('Processing...', 100, 20);
   * ```
   */
  start(message: string, chunks?: number, width?: number): void {
    if (this.#isActive) {
      this.stop();
    }

    if (isSpinner(this.#options)) {
      this.#currentProgress = 0;
    } else if (isHorizontal(this.#options)) {
      if (_.isPosNumber(chunks)) {
        this.#options.total = chunks;
      }
      if (_.isPosInteger(width)) {
        this.#options.width = width;
      }
    } else if (isVertical(this.#options)) {
      if (_.isPosNumber(chunks)) {
        this.#options.total = chunks;
      }
    }

    // if (chunks !== undefined && chunks > 0) {
    //   this.#chunks = chunks;
    //   this.#useSpinner = false;
    //   this.#currentProgress = 0;
    // } else {
    //   this.#useSpinner = true;
    // }

    // if (width !== undefined) {
    //   this.#barWidth = width;
    // } else {
    //   this.#barWidth = 10;
    // }

    this.#isActive = true;
    this.#currentMessage = message;
    this.#frameIndex = 0;

    // Show initial frame
    this.render();

    // Start animation only for spinner mode
    if (isSpinner(this.#options)) {
      const len = blocks.spinner[this.#options.index].length;
      this.#intervalId = setInterval(() => {
        this.#frameIndex = (this.#frameIndex + 1) % len;
        this.render();
      }, 80);
    }
  }

  /**
   * Update the status message and/or progress value.
   *
   * In progress bar mode, the progress value is used to calculate the visual
   * fill level. When the number of chunks exceeds the bar width, partial block
   * characters (▏▎▍▌▋▊▉) are used to show fractional progress at 1/8 character
   * resolution.
   *
   * @param message - The new status message to display
   * @param [progress] - Current progress value in chunks. This value is divided
   *   by the total chunks and multiplied by the bar width to determine the
   *   visual fill level. Only applies to progress bar mode.
   *
   * @example
   * ```ts
   * const progress = new ProgressLine();
   * progress.start('Downloading...', 100);
   *
   * // Update message only (in spinner mode this is common)
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
   * const progress = new ProgressLine();
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
   * In spinner mode, displays the current spinner frame with the message.
   * In progress bar mode, calculates and displays the filled portion of the
   * bar using full blocks (█), partial blocks (▏▎▍▌▋▊▉) for fractional progress,
   * and empty blocks (░) for the remaining space.
   *
   * @private
   */
  private render(): void {
    if (!this.#isActive) {
      return;
    }

    let output: string = '';

    const opts = this.#options;
    if (isSpinner(opts)) {
      const spinner = blocks.spinner[opts.index][this.#frameIndex];
      output = `\r\x1b[K${rgb24(spinner, 0xD02020)} ${this.#currentMessage}`;
    } else if (isHorizontal(opts)) {
      // Calculate fractional progress for fine-grained display
      const exactProgress = (this.#currentProgress / opts.total) * opts.width;
      const fullBlocks = Math.floor(exactProgress);
      const remainder = exactProgress - fullBlocks;

      // Calculate partial block (0-7 representing 0/8 to 7/8)
      const partialIndex = Math.floor(remainder * 8);
      const partialBlock = blocks.horizontal[partialIndex];

      // Calculate remaining empty space
      const usedChars = fullBlocks + (partialBlock ? 1 : 0);
      const emptyCount = Math.max(0, opts.width - usedChars);

      // Build the bar: full blocks + partial block + empty
      const bar = '█'.repeat(fullBlocks) + partialBlock + '░'.repeat(emptyCount);
      output = `\r\x1b[K${rgb24(bar, 0xD02020)} ${this.#currentMessage}`;
    } else if (isVertical(opts)) {
      // Calculate vertical fill level (0-8 for the 9 block characters)
      const exactProgress = (this.#currentProgress / opts.total) * 8;
      const blockIndex = Math.min(8, Math.max(0, Math.floor(exactProgress)));
      const bar = blocks.vertical[blockIndex];
      output = `\r\x1b[K${rgb24(bar, 0xD02020)} ${this.#currentMessage}`;
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
