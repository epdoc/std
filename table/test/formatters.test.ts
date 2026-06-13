import { assertEquals } from '@std/assert';
import { BOOL_PRESETS, formatters } from '../src/mod.ts';

Deno.test('formatters.percent', async (t) => {
  await t.step('should format basic percentage with default 2 decimals and space separator', () => {
    const fmt = formatters.percent();
    assertEquals(fmt(0.5), '50.00 %');
  });

  await t.step('should format zero', () => {
    const fmt = formatters.percent();
    assertEquals(fmt(0), '0.00 %');
  });

  await t.step('should format one (100%)', () => {
    const fmt = formatters.percent();
    assertEquals(fmt(1), '100.00 %');
  });

  await t.step('should format small values below threshold', () => {
    const fmt = formatters.percent();
    assertEquals(fmt(0.00009), '<0.01 %');
    assertEquals(fmt(0.00005), '<0.01 %');
  });

  await t.step('should format exactly 0.01%', () => {
    const fmt = formatters.percent();
    assertEquals(fmt(0.0001), '0.01 %');
    assertEquals(fmt(0.00011), '0.01 %');
  });

  await t.step('should format with custom decimals', () => {
    const fmt0 = formatters.percent(0);
    assertEquals(fmt0(0.5), '50 %');

    const fmt1 = formatters.percent(1);
    assertEquals(fmt1(0.5), '50.0 %');

    const fmt3 = formatters.percent(3);
    assertEquals(fmt3(0.12345), '12.345 %');
  });

  await t.step('should support no separator option', () => {
    const fmt = formatters.percent({ decimals: 2, separator: '' });
    assertEquals(fmt(0.5), '50.00%');
  });

  await t.step('should support custom separator', () => {
    const fmt = formatters.percent({ decimals: 1, separator: '_' });
    assertEquals(fmt(0.452), '45.2_%');
  });

  await t.step('should handle negative values', () => {
    const fmt = formatters.percent();
    assertEquals(fmt(-0.5), '-50.00 %');
  });

  await t.step('should handle values greater than 1', () => {
    const fmt = formatters.percent();
    assertEquals(fmt(1.5), '150.00 %');
    assertEquals(fmt(10), '1000.00 %');
  });

  await t.step('should handle NaN gracefully', () => {
    const fmt = formatters.percent();
    assertEquals(fmt(NaN), 'NaN');
  });

  await t.step('should handle undefined and null', () => {
    const fmt = formatters.percent();
    assertEquals(fmt(undefined), '');
    assertEquals(fmt(null), '0.00 %');
  });

  await t.step('should handle non-numeric values', () => {
    const fmt = formatters.percent();
    assertEquals(fmt('not a number'), 'not a number');
  });
});

Deno.test('formatters.bytes', async (t) => {
  await t.step('should format zero bytes', () => {
    const fmt = formatters.bytes();
    assertEquals(fmt(0), '0 B');
  });

  await t.step('should format bytes (B)', () => {
    const fmt = formatters.bytes();
    assertEquals(fmt(500), '500.0 B');
  });

  await t.step('should format kilobytes (KiB)', () => {
    const fmt = formatters.bytes();
    assertEquals(fmt(1024), '1.0 KiB');
    assertEquals(fmt(1536), '1.5 KiB');
  });

  await t.step('should format megabytes (MiB)', () => {
    const fmt = formatters.bytes();
    assertEquals(fmt(1048576), '1.0 MiB');
    assertEquals(fmt(5242880), '5.0 MiB');
  });

  await t.step('should format gigabytes (GiB)', () => {
    const fmt = formatters.bytes();
    assertEquals(fmt(1073741824), '1.0 GiB');
    assertEquals(fmt(9663676416), '9.0 GiB');
  });

  await t.step('should format terabytes (TiB)', () => {
    const fmt = formatters.bytes();
    assertEquals(fmt(1099511627776), '1.0 TiB');
  });

  await t.step('should format petabytes (PiB)', () => {
    const fmt = formatters.bytes();
    assertEquals(fmt(1125899906842624), '1.0 PiB');
  });

  await t.step('should use custom decimals', () => {
    const fmt0 = formatters.bytes(0);
    assertEquals(fmt0(1536), '2 KiB');

    const fmt2 = formatters.bytes(2);
    assertEquals(fmt2(1536), '1.50 KiB');

    const fmt3 = formatters.bytes(3);
    assertEquals(fmt3(1536), '1.500 KiB');
  });

  await t.step('should support no separator option', () => {
    const fmt = formatters.bytes({ decimals: 1, separator: '' });
    assertEquals(fmt(1536), '1.5KiB');
  });

  await t.step('should support custom separator', () => {
    const fmt = formatters.bytes({ decimals: 2, separator: '_' });
    assertEquals(fmt(1536), '1.50_KiB');
  });

  await t.step('should handle fractional bytes with rounding', () => {
    const fmt = formatters.bytes(2);
    assertEquals(fmt(1234567), '1.18 MiB');
  });

  await t.step('should handle NaN gracefully', () => {
    const fmt = formatters.bytes();
    assertEquals(fmt(NaN), 'NaN');
  });

  await t.step('should handle undefined and null', () => {
    const fmt = formatters.bytes();
    assertEquals(fmt(undefined), '');
    assertEquals(fmt(null), '0 B');
  });

  await t.step('should handle non-numeric values', () => {
    const fmt = formatters.bytes();
    assertEquals(fmt('not a number'), 'not a number');
  });

  await t.step('should handle negative decimals as zero', () => {
    const fmt = formatters.bytes(-1);
    assertEquals(fmt(1536), '2 KiB');
  });
});

Deno.test('formatters.uptime', async (t) => {
  await t.step('should format seconds only', () => {
    const fmt = formatters.uptime();
    assertEquals(fmt(45), '45s');
  });

  await t.step('should format minutes and seconds', () => {
    const fmt = formatters.uptime();
    const result = fmt(90);
    assertEquals(result, '1m30s');
  });

  await t.step('should format hours and minutes', () => {
    const fmt = formatters.uptime();
    const result = fmt(3661);
    assertEquals(result, '1h01m01s');
  });

  await t.step('should format days, hours, and minutes', () => {
    const fmt = formatters.uptime();
    const result = fmt(2700090);
    assertEquals(result, '31d06h01m');
  });

  await t.step('should format zero seconds', () => {
    const fmt = formatters.uptime();
    assertEquals(fmt(0), '0.000s');
  });

  await t.step('should format one day exactly', () => {
    const fmt = formatters.uptime();
    const result = fmt(86400);
    assertEquals(result, '1d');
  });

  await t.step('should handle NaN gracefully', () => {
    const fmt = formatters.uptime();
    assertEquals(fmt(NaN), 'NaN');
  });

  await t.step('should handle undefined and null', () => {
    const fmt = formatters.uptime();
    assertEquals(fmt(undefined), '');
    assertEquals(fmt(null), '0.000s');
  });

  await t.step('should handle non-numeric values', () => {
    const fmt = formatters.uptime();
    assertEquals(fmt('not a number'), 'not a number');
  });

  await t.step('should handle fractional seconds', () => {
    const fmt = formatters.uptime();
    const result = fmt(90.5);
    assertEquals(result, '1m30s');
  });

  await t.step('should support space separator option', () => {
    const fmt = formatters.uptime({ separator: ' ' });
    const result = fmt(2700090);
    assertEquals(result, '31 d 06 h 01 m');
  });

  await t.step('should support custom units count', () => {
    const fmt2 = formatters.uptime({ units: 2 });
    assertEquals(fmt2(2700090), '31d06h');

    const fmt1 = formatters.uptime({ units: 1 });
    assertEquals(fmt1(2700090), '31d');
  });

  await t.step('should support combining separator and units', () => {
    const fmt = formatters.uptime({ separator: ' ', units: 2 });
    assertEquals(fmt(3661), '1 h 01 m');
  });
});

Deno.test('formatters.bool', async (t) => {
  await t.step('should default to check preset with colored output', () => {
    const fmt = formatters.bool();
    assertEquals(fmt(true), '\x1b[38;2;81;214;124m✓\x1b[39m');
    assertEquals(fmt(false), '\x1b[38;2;239;68;68m✗\x1b[39m');
  });

  await t.step('should support check preset name', () => {
    const fmt = formatters.bool('check');
    assertEquals(fmt(true), '\x1b[38;2;81;214;124m✓\x1b[39m');
    assertEquals(fmt(false), '\x1b[38;2;239;68;68m✗\x1b[39m');
  });

  await t.step('should support checkBold preset', () => {
    const fmt = formatters.bool('checkBold');
    assertEquals(fmt(true), '\x1b[38;2;81;214;124m✔\x1b[39m');
    assertEquals(fmt(false), '\x1b[38;2;239;68;68m✖\x1b[39m');
  });

  await t.step('should support circle preset', () => {
    const fmt = formatters.bool('circle');
    assertEquals(fmt(true), '\x1b[38;2;81;214;124m●\x1b[39m');
    assertEquals(fmt(false), '\x1b[38;2;100;116;139m○\x1b[39m');
  });

  await t.step('should support circleDot preset', () => {
    const fmt = formatters.bool('circleDot');
    assertEquals(fmt(true), '\x1b[38;2;81;214;124m●\x1b[39m');
    assertEquals(fmt(false), '\x1b[38;2;100;116;139m‧\x1b[39m');
  });

  await t.step('should support yesno preset', () => {
    const fmt = formatters.bool('yesno');
    assertEquals(fmt(true), '\x1b[38;2;81;214;124myes\x1b[39m');
    assertEquals(fmt(false), '\x1b[38;2;239;68;68mno\x1b[39m');
  });

  await t.step('should support truefalse preset', () => {
    const fmt = formatters.bool('truefalse');
    assertEquals(fmt(true), '\x1b[38;2;81;214;124mtrue\x1b[39m');
    assertEquals(fmt(false), '\x1b[38;2;239;88;103mfalse\x1b[39m');
  });

  await t.step('should support custom characters', () => {
    const fmt = formatters.bool({ trueChar: '✅', falseChar: '❌' });
    assertEquals(fmt(true), '\x1b[38;2;81;214;124m✅\x1b[39m');
    assertEquals(fmt(false), '\x1b[38;2;239;68;68m❌\x1b[39m');
  });

  await t.step('should support custom colors', () => {
    const fmt = formatters.bool({ trueChar: 'yes', falseChar: 'no', trueColor: 0x00ff00, falseColor: 0xff0000 });
    assertEquals(fmt(true), '\x1b[38;2;0;255;0myes\x1b[39m');
    assertEquals(fmt(false), '\x1b[38;2;255;0;0mno\x1b[39m');
  });

  await t.step('should output plain text when colors are set to undefined', () => {
    const fmt = formatters.bool({ trueChar: 'Y', falseChar: 'N', trueColor: undefined, falseColor: undefined });
    assertEquals(fmt(true), 'Y');
    assertEquals(fmt(false), 'N');
  });

  await t.step('should treat truthy values as true', () => {
    const fmt = formatters.bool({ trueChar: 'T', falseChar: 'F', trueColor: undefined, falseColor: undefined });
    assertEquals(fmt(1), 'T');
    assertEquals(fmt('hello'), 'T');
    assertEquals(fmt({}), 'T');
    assertEquals(fmt([]), 'T');
  });

  await t.step('should treat falsy values as false', () => {
    const fmt = formatters.bool({ trueChar: 'T', falseChar: 'F', trueColor: undefined, falseColor: undefined });
    assertEquals(fmt(0), 'F');
    assertEquals(fmt(''), 'F');
    assertEquals(fmt(null), 'F');
    assertEquals(fmt(undefined), 'F');
  });

  await t.step('should handle NaN as falsy', () => {
    const fmt = formatters.bool({ trueChar: 'T', falseChar: 'F', trueColor: undefined, falseColor: undefined });
    assertEquals(fmt(NaN), 'F');
  });

  await t.step('should override preset with custom options', () => {
    const fmt = formatters.bool({ ...BOOL_PRESETS.circleDot, trueChar: '✅' });
    assertEquals(fmt(true), '\x1b[38;2;81;214;124m✅\x1b[39m');
    assertEquals(fmt(false), '\x1b[38;2;100;116;139m‧\x1b[39m');
  });
});
