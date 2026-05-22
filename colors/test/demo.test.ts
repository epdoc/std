import * as Color from '../src/mod.ts';

const W1 = 10;
const W2 = 20;

Deno.test('Palette Demo', () => {
  console.log('\n--- Color Palette Demo ---');
  console.log(
    ' ' + 'Dim'.padEnd(W1) + ' | ' + 'Foreground'.padEnd(W1) + ' | ' + 'Bold'.padEnd(W1) +
      ' | ' + 'White on Background'.padEnd(W2) + ' | ' + 'Black on Background'.padEnd(W2) + ' | ' + 'Hex Value',
  );
  console.log(''.padEnd(120, '-'));

  const maxLen = Math.max(...Object.keys(Color.palette).map((k) => k.length));

  for (const [name, hex] of Object.entries(Color.palette)) {
    const paddedName = name.padEnd(maxLen, ' ');
    const hexStr = '0x' + hex.toString(16).padStart(6, '0');

    // Using string length padding for visual alignment (padding before styling to keep ANSI codes out of length calculation)
    const text1 = paddedName.padEnd(W1);
    const textDim = paddedName.padEnd(W1);
    const textBold = paddedName.padEnd(W1);
    const text4 = paddedName.padEnd(W2);
    const text5 = paddedName.padEnd(W2);

    const styled1 = Color.apply(text1, hex);
    const styledDim = Color.apply(textDim, { fg: hex, dim: true });
    const styledBold = Color.apply(textBold, { fg: hex, bold: true });
    const styled4 = Color.apply(text4, { fg: 0xffffff, bg: hex });
    const styled5 = Color.apply(text5, { fg: 0x000000, bg: hex });

    console.log(` ${styledDim} | ${styled1} | ${styledBold} | ${styled4} | ${styled5} | ${hexStr}`);
  }
  console.log(''.padEnd(120, '-'));
  console.log('\n');
});
