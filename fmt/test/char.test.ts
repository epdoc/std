import { assertEquals } from '@std/assert';
import { char, Direction, IconValues, isDirection, isIcon } from '../src/mod.ts';

Deno.test('char', async (t) => {
  await t.step('should resolve common aliases', () => {
    const fmt = char();
    assertEquals(fmt('check'), '✓');
    assertEquals(fmt('cross'), '✕');
    assertEquals(fmt('star'), '★');
    assertEquals(fmt('warning'), '⚠');
    assertEquals(fmt('info'), 'ℹ');
    assertEquals(fmt('left'), '←');
    assertEquals(fmt('right'), '→');
    assertEquals(fmt('up'), '↑');
    assertEquals(fmt('down'), '↓');
    assertEquals(fmt('bullet'), '•');
    assertEquals(fmt('dot'), '‧');
  });

  await t.step('should resolve dotted icon paths case-insensitively', () => {
    const fmt = char();
    assertEquals(fmt('icon.circle.open'), '○');
    assertEquals(fmt('icon.arrow.line.right'), '→');
    assertEquals(fmt('icon.Arrow.Line.right'), '→');
    assertEquals(fmt('icon.check.standard'), '✓');
  });

  await t.step('should resolve char constant keys', () => {
    const fmt = char();
    assertEquals(fmt('1/2'), '½');
    assertEquals(fmt('fraction.3/4'), '¾');
    assertEquals(fmt('plusMinus'), '±');
    assertEquals(fmt('math.infinity'), '∞');
    assertEquals(fmt('dollar'), '$');
    assertEquals(fmt('superscript.3'), '³');
    assertEquals(fmt('subscript.2'), '₂');
  });

  await t.step('should resolve a glyph to itself', () => {
    assertEquals(char()('✓'), '✓');
  });

  await t.step('should return empty string for unknown names', () => {
    assertEquals(char()('not-a-real-name'), '');
  });
});

Deno.test('icons', async (t) => {
  await t.step('should expose every leaf glyph as a value', () => {
    for (const glyph of IconValues) {
      assertEquals(char()(glyph), glyph);
    }
  });

  await t.step('should guard icon glyphs', () => {
    assertEquals(isIcon('✓'), true);
    assertEquals(isIcon('→'), true);
    assertEquals(isIcon('not-an-icon'), false);
    assertEquals(isIcon(42), false);
  });

  await t.step('should guard direction names', () => {
    for (const dir of Object.values(Direction)) {
      assertEquals(isDirection(dir), true);
    }
    assertEquals(isDirection('diagonal'), false);
    assertEquals(isDirection('→'), false);
  });
});
