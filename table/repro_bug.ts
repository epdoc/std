import { TableRenderer } from './src/render.ts';

type Data = { id: number; name: string };
const data: Data[] = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Charlie' },
];

const table = TableRenderer.create<Data>()
  .column('id', { header: 'ID' })
  .column('name', { header: 'Name' })
  .data(data)
  .borders(true)
  .header({ fg: 0x00ff00, bg: 0x0000ff }) // Green foreground, Blue background for header
  .evenRow({ fg: 0xff0000, bg: 0x323232 }); // Red foreground, Grey background on even rows

console.log('Rendering table...');
const lines = table.render();
lines.forEach((line, i) => {
  console.log(`Line ${i}: ${JSON.stringify(line)}`);
});
