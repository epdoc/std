import { getTerminalSize, visualTruncate } from '@epdoc/terminal/screen';
import { _, type Integer } from '@epdoc/type';
import { rgb24 } from '@std/fmt/colors';
import * as Const from './consts.ts';
import * as Guard from './guards.ts';
import type * as Progress from './types.ts';

const encoder = new TextEncoder();

/**
 * Resolve a {@link Color} value to a numeric hex value for use with `rgb24()`.
 * Returns {@link DEFAULT_COLOR} if the value is undefined or unrecognized.
 */
function resolveColor(color: Progress.Color | undefined): number {
  if (_.isUndefined(color)) {
    return Const.defaultColor;
  }
  if (_.isNumber(color)) {
    return color;
  }
  if (_.isString(color)) {
    return Const.colorMap[color.toLowerCase()] ?? Const.defaultColor;
  }
  return Const.defaultColor;
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
 * const progress = new ProgressLine({ type: 'spinner', index: 'braille', color: 'cyan' });
 * progress.start('Connecting to server...');
 * await connectToServer();
 * progress.stop('Connected!');
 * ```
 *
 * @example Bounce mode for thinking/waiting indicators
 * ```ts
 * const progress = new ProgressLine({ type: 'bounce', index: 'comet', color: 'purple' });
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
  #options: Progress.LineOptions = { type: 'spinner', index: 'braille' };
  #color: number;

  constructor(options: Progress.LineOptions = { type: 'spinner', index: 'braille' }) {
    this.#options = options;
    this.#color = resolveColor(options.color);
    if (options.type === 'horizontal') {
      if (!options.total) options.total = 1;
      if (!options.width) options.width = 10;
    } else if (options.type === 'vertical') {
      if (!options.total) options.total = 1;
    }
  }

  color(color: Progress.Color): this {
    this.#color = resolveColor(color);
    return this;
  }

  bar(total: number = 1, width: Integer = 10): this {
    this.#options = { type: 'horizontal', width: width, total: total };
    return this;
  }

  battery(total: number = 1): this {
    this.#options = { type: 'vertical', total: total };
    return this;
  }

  spinner(type: Progress.Spinner): this {
    this.#options = { type: 'spinner', index: type };
    return this;
  }

  comet(): this {
    this.#options = { type: 'bounce', index: 'comet' };
    return this;
  }

  bouncyBall(): this {
    this.#options = { type: 'bounce', index: 'ball' };
    return this;
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
    if (Guard.isSpinner(this.#options)) {
      const len = Const.blocks.spinner[this.#options.index].length;
      this.#intervalId = setInterval(() => {
        this.#frameIndex = (this.#frameIndex + 1) % len;
        this.render();
      }, 80);
    } else if (Guard.isBounce(this.#options)) {
      const len = Const.blocks.bounce[this.#options.index].length;
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
   * Truncate a message to fit within the terminal width, accounting for overhead.
   *
   * @param message - The message to potentially truncate
   * @param overhead - Number of characters used by the indicator (frame + space, etc.)
   * @returns Truncated message that fits within terminal width
   */
  #truncateMessage(message: string, overhead: number): string {
    const terminalWidth = getTerminalSize().columns;
    const maxMessageWidth = terminalWidth - overhead;
    return visualTruncate(message, Math.max(0, maxMessageWidth));
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
    if (Guard.isSpinner(opts)) {
      const subtype = Guard.isSpinnerType(opts.index) ? opts.index : 'braille';
      const frame = Const.blocks.spinner[subtype][this.#frameIndex];
      const truncatedMessage = this.#truncateMessage(this.#currentMessage, 2); // frame + space
      output = `\r\x1b[K${rgb24(frame, color)} ${truncatedMessage}`;
    } else if (Guard.isBounce(opts)) {
      const subtype = Guard.isBounceType(opts.index) ? opts.index : 'comet';
      const frame = Const.blocks.bounce[subtype][this.#frameIndex];
      const truncatedMessage = this.#truncateMessage(this.#currentMessage, 2); // frame + space
      output = `\r\x1b[K${rgb24(frame, color)} ${truncatedMessage}`;
    } else if (Guard.isHorizontal(opts)) {
      // Calculate fractional progress, clamped to [0, width]
      const exactProgress = Math.min(opts.width, Math.max(0, (this.#currentProgress / opts.total) * opts.width));
      const fullBlocks = Math.floor(exactProgress);
      const remainder = exactProgress - fullBlocks;

      // Calculate partial block (0-7 representing 0/8 to 7/8)
      const partialIndex = Math.floor(remainder * 8);
      const partialBlock = Const.blocks.horizontal[partialIndex];

      // Calculate remaining empty space
      const usedChars = fullBlocks + (partialBlock ? 1 : 0);
      const emptyCount = Math.max(0, opts.width - usedChars);

      // Build the bar: colored filled portion + empty spaces
      const filled = '█'.repeat(fullBlocks) + partialBlock;
      const empty = ' '.repeat(emptyCount);
      const truncatedMessage = this.#truncateMessage(this.#currentMessage, opts.width + 1); // bar + space
      output = `\r\x1b[K${rgb24(filled, color)}${empty} ${truncatedMessage}`;
    } else if (Guard.isVertical(opts)) {
      // Calculate vertical fill level (0-8 for the 9 block characters), clamped
      const exactProgress = Math.min(8, Math.max(0, (this.#currentProgress / opts.total) * 8));
      const blockIndex = Math.floor(exactProgress);
      const bar = Const.blocks.vertical[blockIndex];
      const truncatedMessage = this.#truncateMessage(this.#currentMessage, 2); // block + space
      output = `\r\x1b[K${rgb24(bar, color)} ${truncatedMessage}`;
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

  /**
   * Check if this progress line is currently active.
   *
   * Returns true after `start()` has been called and before `stop()` is called.
   */
  get isActive(): boolean {
    return this.#isActive;
  }
}
