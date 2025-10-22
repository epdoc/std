import { FileSpec, FolderSpec } from '@epdoc/fs';
import { join } from 'node:path';

async function main() {
  const fsTempDir = await FolderSpec.makeTemp();
  const originalCwd = FolderSpec.cwd();
  fsTempDir.chdir();
  let exitCode = 0;

  try {
    console.log(`Using temporary directory: ${fsTempDir.path}`);

    const denoJsonFile = new FileSpec('deno.json');

    // 1. Write initial JSON content
    const initialData = { version: '1.0.0' };
    await denoJsonFile.writeJson(initialData, null, 2);
    console.log('Content after initial write:', await denoJsonFile.readAsString());

    // 2. Simulate the "bump" operation
    const bumpedData = { version: '1.0.1' };
    await denoJsonFile.writeJson(bumpedData, null, 2);
    console.log('Content after bump write:', await denoJsonFile.readAsString());

    // 3. Read the content back as a string
    const content = await denoJsonFile.readAsString();
    console.log(`File content read as string: "${content}"`);

    // 4. Define expected content and assert
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
    originalCwd.chdir();
    await fsTempDir.remove({ recursive: true });
    console.log(`\nCleaned up temporary directory: ${fsTempDir.path}`);
    Deno.exit(exitCode);
  }
}

main();
