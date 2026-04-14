import type { Integer } from '@epdoc/type';
import type { blocks } from './consts.ts';

/**
 * A color value specified as either a hex number (e.g. `0xD02020`) or a named
 * color string (e.g. `'red'`, `'green'`, `'cyan'`).
 *
 * Supported named colors: `red`, `green`, `blue`, `yellow`, `cyan`, `magenta`,
 * `white`, `black`, `orange`, `gray`/`grey`, `purple`.
 */
export type Color = number | string;

export type Mode = keyof typeof blocks;
export type Spinner = keyof typeof blocks.spinner;
export type Bounce = keyof typeof blocks.bounce;

/**
 * Base options shared by all progress line modes.
 */
export type BaseOptions = {
  /** The display color for the progress indicator. Defaults to red (`0xD02020`). */
  color?: Color;
};

export type SpinnerOptions = BaseOptions & { type: 'spinner'; index: Spinner };
export type BounceOptions = BaseOptions & { type: 'bounce'; index: Bounce };
export type HorizontalOptions = BaseOptions & { type: 'horizontal'; total: number; width: Integer };
export type VerticalOptions = BaseOptions & { type: 'vertical'; total: number };

export type LineOptions = SpinnerOptions | BounceOptions | HorizontalOptions | VerticalOptions;
