import { Color } from '../src/mod.ts';

Deno.test('Palette Demo', () => {
  console.log('\n--- Color Palette Demo ---');
  console.log(
    'Foreground'.padEnd(20) + '| White on Background'.padEnd(23) + '| Black on Background'.padEnd(23) + '| Hex Value',
  );
  console.log(''.padEnd(76, '-'));

  const maxLen = Math.max(...Object.keys(Color.palette).map((k) => k.length));

  for (const [name, hex] of Object.entries(Color.palette)) {
    const paddedName = name.padEnd(maxLen, ' ');
    const hexStr = '0x' + hex.toString(16).padStart(6, '0');

    // Using string length padding for visual alignment (padding before styling to keep ANSI codes out of length calculation)
    const text1 = ` ${paddedName} `.padEnd(18, ' ');
    const text2 = ` ${paddedName} `.padEnd(18, ' ');
    const text3 = ` ${paddedName} `.padEnd(18, ' ');

    const styled1 = Color.apply(text1, hex);
    const styled2 = Color.apply(text2, { fg: 0xffffff, bg: hex });
    const styled3 = Color.apply(text3, { fg: 0x000000, bg: hex });

    console.log(`${styled1} | ${styled2} | ${styled3} | ${hexStr}`);
  }
  console.log(''.padEnd(76, '-'));
  console.log('\n');
});
