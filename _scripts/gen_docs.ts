#!/usr/bin/env -S deno run -A
/**
 * @file _scripts/gen_docs.ts
 * @brief Generates JSDoc markdown documentation for each workspace.
 *
 * This script reads the `deno.json` file to identify all defined workspaces,
 * then iterates through each one to generate markdown documentation from its
 * entry point (`mod.ts`). The resulting documentation is saved in the
 * `docs/jsdoc` directory, with each workspace having its own markdown file
 * named after the workspace.
 *
 * @example
 * To run this script:
 * ```sh
 * deno run -A _scripts/gen_docs.ts
 * ```
 */

import { dirname, join, basename, fromFileUrl } from 'jsr:@std/path';

const __dirname = dirname(fromFileUrl(import.meta.url));
const outDir = join(__dirname, '..', 'docs', 'jsdoc');

async function readWorkspaces(): Promise<string[]> {
  try {
    const denoJsonPath = join(__dirname, '..', 'deno.json');
    const content = await Deno.readTextFile(denoJsonPath);
    const json = JSON.parse(content);
    if (Array.isArray(json.workspace)) {
      return json.workspace;
    }
    console.error('Error: `workspace` property not found or not an array in deno.json');
    return [];
  } catch (error) {
    console.error(`Error reading or parsing deno.json: ${error.message}`);
    return [];
  }
}

async function generateDocs() {
  const workspaces = await readWorkspaces();
  if (workspaces.length === 0) {
    console.log('No workspaces found. Exiting.');
    return;
  }

  try {
    await Deno.mkdir(outDir, { recursive: true });
  } catch (error) {
    if (error.name !== 'AlreadyExists') {
      console.error(`Error creating output directory "${outDir}": ${error.message}`);
      return;
    }
  }

  for (const ws of workspaces) {
    const entryPoint = join(__dirname, '..', ws, 'mod.ts');
        const outFile = join(outDir, `${ws.split('/').pop()}.json`);
    console.log(`Generating docs for ${ws}...`);

    const process = Deno.run({
      cmd: ['deno', 'doc', '--json', entryPoint],
      stdout: 'piped',
      stderr: 'piped',
    });

    const { code } = await process.status();

    if (code === 0) {
      const rawOutput = await process.output();
      await Deno.writeFile(outFile, rawOutput);
      console.log(`  ✔ Successfully generated: ${outFile}`);
    } else {
      const rawError = await process.stderrOutput();
      const errorString = new TextDecoder().decode(rawError);
      console.error(`  ✖ Error generating docs for ${ws}: ${errorString}`);
    }
    process.close();
  }
}

if (import.meta.main) {
  await generateDocs();
}
