import { assertEquals } from '@std/assert';
import { describe, it } from '@std/testing/bdd';
import { bool, BOOL_PRESETS, bytes, percent, uptime } from '../src/mod.ts';

describe('percent', () => {
  it('should format basic percentage with default 2 decimals and space separator', () => {
    const fmt = percent();
    assertEquals(fmt(0.5), '50.00 %');
  });

  it('should format zero', () => {
    const fmt = percent();
    assertEquals(fmt(0), '0.00 %');
  });

  it('should format one (100%)', () => {
    const fmt = percent();
    assertEquals(fmt(1), '100.00 %');
  });

  it('should format small values below threshold', () => {
    const fmt = percent();
    assertEquals(fmt(0.00009), '<0.01 %');
    assertEquals(fmt(0.00005), '<0.01 %');
  });

  it('should format exactly 0.01%', () => {
    const fmt = percent();
    assertEquals(fmt(0.0001), '0.01 %');
    assertEquals(fmt(0.00011), '0.01 %');
  });

  it('should format with custom decimals', () => {
    const fmt0 = percent(0);
    assertEquals(fmt0(0.5), '50 %');

    const fmt1 = percent(1);
    assertEquals(fmt1(0.5), '50.0 %');

    const fmt3 = percent(3);
    assertEquals(fmt3(0.12345), '12.345 %');
  });

  it('should support no separator option', () => {
    const fmt = percent({ decimals: 2, separator: '' });
    assertEquals(fmt(0.5), '50.00%');
  });

  it('should support custom separator', () => {
    const fmt = percent({ decimals: 1, separator: '_' });
    assertEquals(fmt(0.452), '45.2_%');
  });

  it('should handle negative values', () => {
    const fmt = percent();
    assertEquals(fmt(-0.5), '-50.00 %');
  });

  it('should handle values greater than 1', () => {
    const fmt = percent();
    assertEquals(fmt(1.5), '150.00 %');
    assertEquals(fmt(10), '1000.00 %');
  });

  it('should handle NaN gracefully', () => {
    const fmt = percent();
    assertEquals(fmt(NaN), 'NaN');
  });

  it('should handle undefined and null', () => {
    const fmt = percent();
    assertEquals(fmt(undefined), '');
    assertEquals(fmt(null), '0.00 %');
  });

  it('should handle non-numeric values', () => {
    const fmt = percent();
    assertEquals(fmt('not a number'), 'not a number');
  });
});

describe('bytes', () => {
  it('should format zero bytes', () => {
    const fmt = bytes();
    assertEquals(fmt(0), '0 B');
  });

  it('should format bytes (B)', () => {
    const fmt = bytes();
    assertEquals(fmt(500), '500.0 B');
  });

  it('should format kilobytes (KiB)', () => {
    const fmt = bytes();
    assertEquals(fmt(1024), '1.0 KiB');
    assertEquals(fmt(1536), '1.5 KiB');
  });

  it('should format megabytes (MiB)', () => {
    const fmt = bytes();
    assertEquals(fmt(1048576), '1.0 MiB');
    assertEquals(fmt(5242880), '5.0 MiB');
  });

  it('should format gigabytes (GiB)', () => {
    const fmt = bytes();
    assertEquals(fmt(1073741824), '1.0 GiB');
    assertEquals(fmt(9663676416), '9.0 GiB');
  });

  it('should format terabytes (TiB)', () => {
    const fmt = bytes();
    assertEquals(fmt(1099511627776), '1.0 TiB');
  });

  it('should format petabytes (PiB)', () => {
    const fmt = bytes();
    assertEquals(fmt(1125899906842624), '1.0 PiB');
  });

  it('should use custom decimals', () => {
    const fmt0 = bytes(0);
    assertEquals(fmt0(1536), '2 KiB');

    const fmt2 = bytes(2);
    assertEquals(fmt2(1536), '1.50 KiB');

    const fmt3 = bytes(3);
    assertEquals(fmt3(1536), '1.500 KiB');
  });

  it('should support no separator option', () => {
    const fmt = bytes({ decimals: 1, separator: '' });
    assertEquals(fmt(1536), '1.5KiB');
  });

  it('should support custom separator', () => {
    const fmt = bytes({ decimals: 2, separator: '_' });
    assertEquals(fmt(1536), '1.50_KiB');
  });

  it('should handle fractional bytes with rounding', () => {
    const fmt = bytes(2);
    assertEquals(fmt(1234567), '1.18 MiB');
  });

  it('should handle NaN gracefully', () => {
    const fmt = bytes();
    assertEquals(fmt(NaN), 'NaN');
  });

  it('should handle undefined and null', () => {
    const fmt = bytes();
    assertEquals(fmt(undefined), '');
    assertEquals(fmt(null), '0 B');
  });

  it('should handle non-numeric values', () => {
    const fmt = bytes();
    assertEquals(fmt('not a number'), 'not a number');
  });

  it('should handle negative decimals as zero', () => {
    const fmt = bytes(-1);
    assertEquals(fmt(1536), '2 KiB');
  });
});

describe('uptime', () => {
  it('should format seconds only', () => {
    const fmt = uptime();
    assertEquals(fmt(45), '45s');
  });

  it('should format minutes and seconds', () => {
    const fmt = uptime();
    const result = fmt(90);
    assertEquals(result, '1m30s');
  });

  it('should format hours and minutes', () => {
    const fmt = uptime();
    const result = fmt(3661);
    assertEquals(result, '1h01m01s');
  });

  it('should format days, hours, and minutes', () => {
    const fmt = uptime();
    const result = fmt(2700090);
    assertEquals(result, '31d06h01m');
  });

  it('should format zero seconds', () => {
    const fmt = uptime();
    assertEquals(fmt(0), '0.000s');
  });

  it('should format one day exactly', () => {
    const fmt = uptime();
    const result = fmt(86400);
    assertEquals(result, '1d');
  });

  it('should handle NaN gracefully', () => {
    const fmt = uptime();
    assertEquals(fmt(NaN), 'NaN');
  });

  it('should handle undefined and null', () => {
    const fmt = uptime();
    assertEquals(fmt(undefined), '');
    assertEquals(fmt(null), '0.000s');
  });

  it('should handle non-numeric values', () => {
    const fmt = uptime();
    assertEquals(fmt('not a number'), 'not a number');
  });

  it('should handle fractional seconds', () => {
    const fmt = uptime();
    const result = fmt(90.5);
    assertEquals(result, '1m30s');
  });

  it('should support space separator option', () => {
    const fmt = uptime({ separator: ' ' });
    const result = fmt(2700090);
    assertEquals(result, '31 d 06 h 01 m');
  });

  it('should support custom units count', () => {
    const fmt2 = uptime({ units: 2 });
    assertEquals(fmt2(2700090), '31d06h');

    const fmt1 = uptime({ units: 1 });
    assertEquals(fmt1(2700090), '31d');
  });

  it('should support combining separator and units', () => {
    const fmt = uptime({ separator: ' ', units: 2 });
    assertEquals(fmt(3661), '1 h 01 m');
  });
});

describe('bool', () => {
  it('should default to check preset with colored output', () => {
    const fmt = bool();
    assertEquals(fmt(true), '\x1b[38;2;81;214;124m✓\x1b[39m');
    assertEquals(fmt(false), '\x1b[38;2;239;68;68m✗\x1b[39m');
  });

  it('should support check preset name', () => {
    const fmt = bool('check');
    assertEquals(fmt(true), '\x1b[38;2;81;214;124m✓\x1b[39m');
    assertEquals(fmt(false), '\x1b[38;2;239;68;68m✗\x1b[39m');
  });

  it('should support checkBold preset', () => {
    const fmt = bool('checkBold');
    assertEquals(fmt(true), '\x1b[38;2;81;214;124m✔\x1b[39m');
    assertEquals(fmt(false), '\x1b[38;2;239;68;68m✖\x1b[39m');
  });

  it('should support circle preset', () => {
    const fmt = bool('circle');
    assertEquals(fmt(true), '\x1b[38;2;81;214;124m●\x1b[39m');
    assertEquals(fmt(false), '\x1b[38;2;100;116;139m○\x1b[39m');
  });

  it('should support circleDot preset', () => {
    const fmt = bool('circleDot');
    assertEquals(fmt(true), '\x1b[38;2;81;214;124m●\x1b[39m');
    assertEquals(fmt(false), '\x1b[38;2;100;116;139m‧\x1b[39m');
  });

  it('should support yesno preset', () => {
    const fmt = bool('yesno');
    assertEquals(fmt(true), '\x1b[38;2;81;214;124myes\x1b[39m');
    assertEquals(fmt(false), '\x1b[38;2;239;68;68mno\x1b[39m');
  });

  it('should support truefalse preset', () => {
    const fmt = bool('truefalse');
    assertEquals(fmt(true), '\x1b[38;2;81;214;124mtrue\x1b[39m');
    assertEquals(fmt(false), '\x1b[38;2;239;88;103mfalse\x1b[39m');
  });

  it('should support custom characters', () => {
    const fmt = bool({ trueChar: '✅', falseChar: '❌' });
    assertEquals(fmt(true), '\x1b[38;2;81;214;124m✅\x1b[39m');
    assertEquals(fmt(false), '\x1b[38;2;239;68;68m❌\x1b[39m');
  });

  it('should support custom colors', () => {
    const fmt = bool({ trueChar: 'yes', falseChar: 'no', trueColor: 0x00ff00, falseColor: 0xff0000 });
    assertEquals(fmt(true), '\x1b[38;2;0;255;0myes\x1b[39m');
    assertEquals(fmt(false), '\x1b[38;2;255;0;0mno\x1b[39m');
  });

  it('should output plain text when colors are set to undefined', () => {
    const fmt = bool({ trueChar: 'Y', falseChar: 'N', trueColor: undefined, falseColor: undefined });
    assertEquals(fmt(true), 'Y');
    assertEquals(fmt(false), 'N');
  });

  it('should treat truthy values as true', () => {
    const fmt = bool({ trueChar: 'T', falseChar: 'F', trueColor: undefined, falseColor: undefined });
    assertEquals(fmt(1), 'T');
    assertEquals(fmt('hello'), 'T');
    assertEquals(fmt({}), 'T');
    assertEquals(fmt([]), 'T');
  });

  it('should treat falsy values as false', () => {
    const fmt = bool({ trueChar: 'T', falseChar: 'F', trueColor: undefined, falseColor: undefined });
    assertEquals(fmt(0), 'F');
    assertEquals(fmt(''), 'F');
    assertEquals(fmt(null), 'F');
    assertEquals(fmt(undefined), 'F');
  });

  it('should handle NaN as falsy', () => {
    const fmt = bool({ trueChar: 'T', falseChar: 'F', trueColor: undefined, falseColor: undefined });
    assertEquals(fmt(NaN), 'F');
  });

  it('should override preset with custom options', () => {
    const fmt = bool({ ...BOOL_PRESETS.circleDot, trueChar: '✅' });
    assertEquals(fmt(true), '\x1b[38;2;81;214;124m✅\x1b[39m');
    assertEquals(fmt(false), '\x1b[38;2;100;116;139m‧\x1b[39m');
  });
});
