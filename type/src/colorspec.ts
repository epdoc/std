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
export type Def = {
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
export type Spec = StyleFn | number | Def;

export const palette = {
  // Neutrals
  black: 0x000000,
  charcoal: 0x374151,
  slate: 0x64748b,
  steel: 0x8899aa, // blue-gray
  gray: 0x9ca3af,
  cream: 0xfdf6e3,
  tan: 0xd2b48c,
  taupe: 0xb5a090,
  stone: 0xa89880,
  white: 0xffffff,

  // Reds
  crimson: 0xdc143c,
  red: 0xef4444,
  coral: 0xff6b6b,
  rose: 0xfb7185,
  pink: 0xef5867,
  terracotta: 0xe07850,
  rust: 0xc44f1e,

  // Oranges / Yellows
  orange: 0xf0883e,
  amber: 0xffb020,
  gold: 0xff981a,
  yellow: 0xfbbf24,
  lemon: 0xfde047,

  // Greens
  lime: 0xa3e635,
  green: 0x51d67c,
  mint: 0x6ee7b7,
  teal: 0x2dd4a8,
  sage: 0x8fad88,
  olive: 0xa8b040,
  moss: 0x7a9a5a,

  // Blues
  navy: 0x1e3a5f,
  blue: 0x60a5fa,
  sky: 0x38bdf8,
  cyan: 0x58d1eb,

  // Purples
  indigo: 0x818cf8,
  violet: 0xa78bfa,
  purple: 0xa855f7,
  lavender: 0xc4b5fd,
  lilac: 0xe0a0ff,
  magenta: 0xe879f9,

  // Earth tones
  sand: 0xe8c99a,
  wheat: 0xf5deb3,
  ochre: 0xcb8c00,
  bronze: 0xcd7f32,
  copper: 0xb87333,
  sienna: 0xc47a45,
  brown: 0xa0724a,
} as const;
