import { bool, BOOL_PRESETS, bytes, percent, uptime } from '../src/mod.ts';

const HEADER = '─'.repeat(48);
function section(title: string) {
  console.log(`\n${HEADER}`);
  console.log(`  ${title}`);
  console.log(`${HEADER}`);
}

Deno.test('fmt demo', async (t) => {
  await t.step('percent', () => {
    section('Percent');
    const labels = ['CPU', 'Memory', 'Disk', 'Network'];
    const values = [0.234, 0.567, 0.891, 0.012];
    const fmt = percent({ decimals: 1 });
    for (let i = 0; i < labels.length; i++) {
      console.log(`  ${labels[i]}: ${fmt(values[i])}`);
    }
  });

  await t.step('bytes', () => {
    section('Bytes');
    const labels = ['File', 'Memory', 'Disk', 'Logs'];
    const values = [500, 1048576, 1073741824, 1125899906842624];
    const fmt = bytes({ decimals: 1 });
    for (let i = 0; i < labels.length; i++) {
      console.log(`  ${labels[i]}: ${fmt(values[i])}`);
    }
  });

  await t.step('uptime', () => {
    section('Uptime');
    const labels = ['Process', 'Server', 'Service'];
    const values = [90, 3661, 2700090];
    for (let i = 0; i < labels.length; i++) {
      console.log(`  ${labels[i]}: ${uptime()(values[i])}`);
    }
  });

  await t.step('bool presets', () => {
    section('Bool Presets (true / false)');
    const presetNames = Object.keys(BOOL_PRESETS) as (keyof typeof BOOL_PRESETS)[];
    for (const name of presetNames) {
      const fmt = bool(name);
      const val = `${fmt(true)}  ${fmt(false)}`;
      console.log(`  ${name.padEnd(14)} ${val}`);
    }
  });

  await t.step('bool custom', () => {
    section('Bool Custom');
    const fmt = bool({ trueChar: '✅', falseChar: '❌', trueColor: 0x00ff00, falseColor: 0xff0000 });
    console.log(`  custom:   ${fmt(true)} ${fmt(false)}`);
    const plain = bool({ trueChar: 'Y', falseChar: 'N', trueColor: undefined, falseColor: undefined });
    console.log(`  plain:    ${plain(true)} ${plain(false)}`);
  });
});
