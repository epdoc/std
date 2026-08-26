// ==========================================
// 1. Define the TypeScript Types
// ==========================================

/** Direction names used for arrow and sort indicators. */
export const Direction = {
  right: 'right',
  left: 'left',
  up: 'up',
  down: 'down',
} as const;
/** Union of the direction names defined in {@link Direction}. */
export type DirectionType = typeof Direction[keyof typeof Direction];
/** All direction names as a flat array. */
export const DirectionValues: DirectionType[] = Object.values(Direction);
/**
 * Type guard that checks whether a value is one of the {@link Direction} names.
 */
export function isDirection(value: unknown): value is DirectionType {
  return DirectionValues.includes(value as DirectionType);
}

// ==========================================
// 2. Define the Complete Icon Implementation
// ==========================================

/**
 * A curated set of Unicode glyphs for common UI states, grouped by category.
 * The nesting is arbitrary; use {@link IconValues} or `char()` from
 * `./char.ts` for flat lookups.
 */
export const Icon = {
  Circle: {
    open: '○',
    filled: '●',
    dot: '‧',
    bullet: '•',
    fisheye: '◉',
    bullseye: '◎',
  },
  Check: {
    standard: '✓',
    heavy: '✔',
    boxOpen: '☑',
  },
  Cross: {
    standard: '✕', // Clean, centered cross (Dingbat \u2715)
    heavy: '✘', // Solid, heavy ballot cross (\u2718)
    ballot: '✗', // Light ballot cross (\u2717)
  },
  Arrow: {
    Line: {
      right: '→',
      left: '←',
      up: '↑',
      down: '↓',
    },
    Double: {
      right: '⇒',
      left: '⇐',
      up: '⇑',
      down: '⇓',
    },
    Ptr: {
      right: '▸',
      left: '◂',
      up: '▴',
      down: '▾',
    },
  },
  Square: {
    open: '□',
    filled: '■',
    smallOpen: '▫',
    smallFilled: '▪',
  },
  Alert: {
    warning: '⚠',
    info: 'ℹ',
    star: '★',
    starOpen: '☆',
  },
} as const;

/**
 * Recursively extracts every leaf value from a nested object, regardless of depth.
 */
type DeepValueOf<T> = T extends object ? { [K in keyof T]: DeepValueOf<T[K]> }[keyof T]
  : T;

/** Flat union of all icon glyphs ('○' | '●' | '‧' | ... | '☆'). */
export type IconType = DeepValueOf<typeof Icon>;

/** Recursively collects leaf strings into a flat runtime array. */
function getLeafValues<T extends object>(obj: T): IconType[] {
  return Object.values(obj).flatMap((val) =>
    typeof val === 'object' && val !== null ? getLeafValues(val as object) : (val as IconType)
  );
}

/** All icon glyphs as a flat array. */
export const IconValues: IconType[] = getLeafValues(Icon);

// O(1) Set lookup for the runtime type guard
const ICON_SET: Set<unknown> = new Set(IconValues);

/**
 * Type guard that checks whether a value is one of the {@link Icon} glyphs.
 */
export function isIcon(value: unknown): value is IconType {
  return ICON_SET.has(value);
}
