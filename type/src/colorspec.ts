/**
 * A function that wraps text with ANSI styling. Compatible with all functions
 * from `@std/fmt/colors` (e.g. `bold`, `rgb24`, `dim`, `green`).
 *
 * @example
 * ```ts
 * import { bold, rgb24 } from '@std/fmt/colors';
 *
 * const headerStyle: StyleFn = (s) => bold(rgb24(s, 0x58d1eb));
 * const greenText: StyleFn = (s) => rgb24(s, 0x51d67c);
 * ```
 */
export type StyleFn = (text: string) => string;

/**
 * A color specification that can define foreground and/or background colors.
 * Used when you need explicit control over both text and background colors.
 *
 * @example
 * ```ts
 * // Background only
 * const bgRed: ColorSpec = { bg: 0xff0000 };
 *
 * // Foreground only
 * const fgGreen: ColorSpec = { fg: 0x00ff00 };
 *
 * // Both foreground and background
 * const whiteOnRed: ColorSpec = { fg: 0xffffff, bg: 0xff0000 };
 * ```
 */
export type ColorSpec = {
  /** Foreground (text) color as a hex number (e.g., 0x51d67c) */
  fg?: number;
  /** Background color as a hex number (e.g., 0x1a1a2e) */
  bg?: number;
};

/**
 * Flexible color/style specification accepted throughout the table API.
 *
 * - **`StyleFn`** — Full control with custom ANSI styling (bold, italic, etc.)
 * - **`number`** — Shorthand for foreground color (most common case)
 * - **`ColorSpec`** — Explicit foreground and/or background colors
 *
 * @example
 * ```ts
 * import { bold, rgb24 } from '@std/fmt/colors';
 *
 * // Foreground color shorthand (most common)
 * const redText: ColorType = 0xff0000;
 *
 * // Background color
 * const bgBlue: ColorType = { bg: 0x0000ff };
 *
 * // Both foreground and background
 * const whiteOnBlack: ColorType = { fg: 0xffffff, bg: 0x000000 };
 *
 * // Full control with StyleFn
 * const styledText: ColorType = (s) => bold(rgb24(s, 0x58d1eb));
 * ```
 */
export type ColorType = StyleFn | number | ColorSpec;
