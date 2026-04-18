import { Color } from '../src/mod.ts';
import { assertEquals, assertStrictEquals } from '@std/assert';
import { bgRgb24, rgb24 } from '@std/fmt/colors';

Deno.test('Color module tests', async (t) => {
  await t.step('toStyleFn with StyleFn', () => {
    const customFn: Color.StyleFn = (s) => `custom-${s}-custom`;
    const fn = Color.toStyleFn(customFn);
    assertStrictEquals(fn, customFn);
    assertEquals(fn('test'), 'custom-test-custom');
  });

  await t.step('toStyleFn with number (foreground)', () => {
    const fn = Color.toStyleFn(0xff0000);
    const expected = rgb24('test', 0xff0000);
    assertEquals(fn('test'), expected);
  });

  await t.step('toStyleFn with Def (foreground only)', () => {
    const fn = Color.toStyleFn({ fg: 0x00ff00 });
    const expected = rgb24('test', 0x00ff00);
    assertEquals(fn('test'), expected);
  });

  await t.step('toStyleFn with Def (background only)', () => {
    const fn = Color.toStyleFn({ bg: 0x0000ff });
    const expected = bgRgb24('test', 0x0000ff);
    assertEquals(fn('test'), expected);
  });

  await t.step('toStyleFn with Def (foreground and background)', () => {
    const fn = Color.toStyleFn({ fg: 0xffffff, bg: 0x000000 });
    // It applies bg first then fg in toStyleFn:
    // let r = s;
    // if (spec.fg !== undefined) r = rgb24(r, spec.fg);
    // if (spec.bg !== undefined) r = bgRgb24(r, spec.bg);
    // Wait, let's look at the implementation.
    // It does fg then bg, so bg wraps fg wraps text.
    const expected = bgRgb24(rgb24('test', 0xffffff), 0x000000);
    assertEquals(fn('test'), expected);
  });

  await t.step('apply utility', () => {
    assertEquals(Color.apply('test', Color.palette.cyan), rgb24('test', Color.palette.cyan));
    assertEquals(Color.apply('test', { fg: Color.palette.gold }), rgb24('test', Color.palette.gold));
  });

  await t.step('palette has expected colors', () => {
    assertEquals(Color.palette.white, 0xffffff);
    assertEquals(Color.palette.black, 0x000000);
    assertEquals(Color.palette.green, 0x51d67c);
    assertEquals(Color.palette.cyan, 0x58d1eb);
    assertEquals(Color.palette.sand, 0xe8c99a);
  });
});
