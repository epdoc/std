import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

async function main() {
  const tempDir = await Deno.makeTempDir();
  const filePath = join(tempDir, 'deno.json');
  let exitCode = 0;

  try {
    console.log(`Using temporary directory: ${tempDir}`);

    // 1. Write initial JSON content
    const initialData = { version: '1.0.0' };
    await writeFile(filePath, JSON.stringify(initialData, null, 2));
    console.log('Wrote initial file:', JSON.stringify(initialData, null, 2));

    // 2. Simulate the "bump" operation
    const bumpedData = { version: '1.0.1' };
    await writeFile(filePath, JSON.stringify(bumpedData, null, 2));
    console.log('Wrote bumped file:', JSON.stringify(bumpedData, null, 2));

    // 3. Read the content back as a string
    const content = await readFile(filePath, 'utf-8');
    console.log(`File content read as string: "${content}"`);

    // 4. Read and parse the JSON content
    const jsonContent = JSON.parse(await readFile(filePath, 'utf-8'));
    console.log('File content parsed as JSON:', jsonContent);

    // 5. Define expected content and assert
    const expectedContent = JSON.stringify({ version: '1.0.1' }, null, 2);
    console.log(`Expected string content: "${expectedContent}"`);

    console.assert(
      content === expectedContent,
      'Assertion Failed: File content read as string does not match expected content.',
    );

    if (content === expectedContent) {
      console.log('\n✅ Test Passed: Read string content matches expected content.');
    } else {
      console.error(`\n❌ Test Failed:`);
      console.error(`- Expected: "${expectedContent}"`);
      console.error(`- Got: "${content}"`);
      exitCode = 1;
    }
  } catch (err) {
    console.error('\nAn unexpected error occurred:', err);
    exitCode = 1;
  } finally {
    // Clean up the temporary directory
    await Deno.remove(tempDir, { recursive: true });
    console.log(`\nCleaned up temporary directory: ${tempDir}`);
    Deno.exit(exitCode);
  }
}

main();
