import { Icon } from './icons.ts';

/** Superscript digit glyphs indexed by digit (0-9). */
export const SuperScript = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];
/** Subscript digit glyphs indexed by digit (0-9). */
export const SubScript = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];

/** Superscript letter glyphs (common ones). */
export const SuperScriptLetters = {
  a: 'ᵃ',
  b: 'ᵇ',
  c: 'ᶜ',
  d: 'ᵈ',
  e: 'ᵉ',
  f: 'ᶠ',
  g: 'ᵍ',
  h: 'ʰ',
  i: 'ⁱ',
  j: 'ʲ',
  k: 'ᵏ',
  l: 'ˡ',
  m: 'ᵐ',
  n: 'ⁿ',
  o: 'ᵒ',
  p: 'ᵖ',
  r: 'ʳ',
  s: 'ˢ',
  t: 'ᵗ',
  u: 'ᵘ',
  v: 'ᵛ',
  w: 'ʷ',
  x: 'ˣ',
  y: 'ʸ',
  z: 'ᶻ',
};

/** Unicode vulgar fraction glyphs keyed by slash form (e.g. '1/2'). */
export const Fractions: Record<string, string> = {
  '1/4': '¼',
  '1/2': '½',
  '3/4': '¾',
  '1/7': '⅐',
  '1/9': '⅑',
  '1/10': '⅒',
  '1/3': '⅓',
  '2/3': '⅔',
  '1/5': '⅕',
  '2/5': '⅖',
  '3/5': '⅗',
  '4/5': '⅘',
  '1/6': '⅙',
  '5/6': '⅚',
  '1/8': '⅛',
  '3/8': '⅜',
  '5/8': '⅝',
  '7/8': '⅞',
};

/** Common mathematical symbols. */
export const MathSymbols = {
  // Operations
  plusMinus: '±',
  minusPlus: '∓',
  multiply: '×',
  divide: '÷',
  dot: '⋅',
  asterisk: '∗',

  // Comparisons
  notEqual: '≠',
  approx: '≈',
  congruent: '≡',
  lessOrEqual: '≤',
  greaterOrEqual: '≥',

  // Sets
  element: '∈',
  notElement: '∉',
  subset: '⊂',
  superset: '⊃',
  intersection: '∩',
  union: '∪',
  empty: '∅',

  // Calculus
  integral: '∫',
  doubleIntegral: '∬',
  tripleIntegral: '∭',
  partial: '∂',
  nabla: '∇',
  infinity: '∞',

  // Roots
  sqrt: '√',
  cubeRoot: '∛',
  fourthRoot: '∜',
};

/** Currency symbols. */
export const Currency = {
  dollar: '$',
  cent: '¢',
  euro: '€',
  pound: '£',
  yen: '¥',
  franc: '₣',
  lira: '₤',
  rupee: '₨',
  won: '₩',
  bitcoin: '₿',
  peso: '₱',
  ruble: '₽',
  shekel: '₪',
  baht: '฿',
  tugrik: '₮',
};

type CharMap = Record<string, string>;

/** Flattens a nested object of glyphs into lowercase dotted keys plus identity keys for each glyph. */
function flattenGlyphs(obj: object, prefix: string, map: CharMap): void {
  for (const [key, val] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof val === 'object' && val !== null) {
      flattenGlyphs(val, path.toLowerCase(), map);
    } else if (typeof val === 'string') {
      map[path.toLowerCase()] = val;
      map[val] = val;
    }
  }
}

/** Builds the flat semantic name → glyph lookup map. */
function buildCharMap(): CharMap {
  const map: CharMap = {};

  // Icon glyphs, keyed by dotted path (e.g. 'icon.circle.open') and by glyph identity.
  flattenGlyphs(Icon, 'icon', map);

  // Fractions: 'fraction.1/2' plus the bare slash form '1/2'.
  flattenGlyphs(Fractions, 'fraction', map);
  for (const [key, glyph] of Object.entries(Fractions)) {
    map[key] = glyph;
    map[key.toLowerCase()] = glyph;
  }

  // Math symbols and currency: dotted path plus the bare key.
  flattenGlyphs(MathSymbols, 'math', map);
  for (const [key, glyph] of Object.entries(MathSymbols)) {
    map[key] = glyph;
    map[key.toLowerCase()] = glyph;
  }
  flattenGlyphs(Currency, 'currency', map);
  for (const [key, glyph] of Object.entries(Currency)) {
    map[key] = glyph;
    map[key.toLowerCase()] = glyph;
  }

  // Superscript/subscript digits and letters.
  SuperScript.forEach((glyph, i) => {
    map[`superscript.${i}`] = glyph;
    map[glyph] = glyph;
  });
  SubScript.forEach((glyph, i) => {
    map[`subscript.${i}`] = glyph;
    map[glyph] = glyph;
  });
  for (const [key, glyph] of Object.entries(SuperScriptLetters)) {
    map[`superscript.${key}`] = glyph;
    map[glyph] = glyph;
  }

  // Common short aliases, applied last so they win over bare constant keys.
  map['left'] = Icon.Arrow.Line.left;
  map['right'] = Icon.Arrow.Line.right;
  map['up'] = Icon.Arrow.Line.up;
  map['down'] = Icon.Arrow.Line.down;
  map['arrow'] = Icon.Arrow.Line.right;
  map['check'] = Icon.Check.standard;
  map['cross'] = Icon.Cross.standard;
  map['star'] = Icon.Alert.star;
  map['warning'] = Icon.Alert.warning;
  map['info'] = Icon.Alert.info;
  map['bullet'] = Icon.Circle.bullet;
  map['dot'] = Icon.Circle.dot;
  map['circle'] = Icon.Circle.open;
  map['square'] = Icon.Square.open;

  return map;
}

const CHAR_MAP: CharMap = buildCharMap();

/**
 * Factory function that creates a character/icon lookup formatter.
 *
 * The returned function resolves a semantic name to its Unicode glyph. Names are
 * dotted paths into the {@link Icon} map (e.g. `'icon.circle.open'`), common
 * aliases (`'check'`, `'left'`, `'star'`, `'warning'`, ...), the slash forms and
 * bare keys of the char constants (`'1/2'`, `'plusMinus'`, `'dollar'`), or a
 * glyph itself. Matching is case-insensitive for dotted paths and bare keys.
 * Unknown names resolve to an empty string.
 *
 * @returns A formatter function: `(name: string) => string`
 *
 * @example
 * ```ts
 * char()('check');                // "✓"
 * char()('left');                 // "←"
 * char()('icon.arrow.line.right') // "→"
 * char()('1/2');                  // "½"
 * char()('not-a-real-name');      // ""
 * ```
 */
export function char(): (name: string) => string {
  return (name: string): string => CHAR_MAP[name] ?? CHAR_MAP[name.toLowerCase()] ?? '';
}
