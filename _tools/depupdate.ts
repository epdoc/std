#!/usr/bin/env -S deno run --allow-read --allow-write
import { FileSpec, FolderSpec, WalkOptions } from '../fs/mod.ts';
import { asError } from '../type/util.ts';

interface PackageInfo {
  name: string;
  version: string;
  path: FileSpec;
}

interface Reference {
  file: string;
  line: number;
  content: string;
  version: string;
}

type DenoJson = {
  name: string;
  version: string;
  workspace?: string[];
  imports?: Record<string, string>;
};

async function findWorkspaces(workspaces: string[], rootSpec: FolderSpec): Promise<PackageInfo[]> {
  const packages: PackageInfo[] = [];

  for (const workspace of workspaces) {
    const denoPath = new FileSpec(rootSpec, workspace, 'deno.json');
    try {
      const workspaceDeno = (await denoPath.readJson()) as DenoJson;
      if (workspaceDeno.name?.startsWith('@epdoc/')) {
        packages.push({
          name: workspaceDeno.name,
          version: workspaceDeno.version,
          path: new FileSpec(rootSpec.path, workspace),
        });
      }
    } catch (error) {
      const err = asError(error);
      console.warn(`Warning: Could not read ${denoPath.path}: ${err.message}`);
    }
  }

  return packages;
}

async function findReferences(pkg: PackageInfo, rootSpec: FolderSpec): Promise<Reference[]> {
  const references: Reference[] = [];
  const pattern = new RegExp(`${pkg.name}@([0-9]+\\.[0-9]+\\.[0-9]+)`);

  const walkOpts: WalkOptions = {
    match: [/\.ts$/, /\.json$/],
    skip: [/node_modules/, /\.git/],
  };
  const entries = await rootSpec.walk(walkOpts);
  for (const entry of entries) {
    if (entry instanceof FileSpec) {
      const lines = await entry.readAsLines();
      lines.forEach((line: string, idx: number) => {
        const match = pattern.exec(line);
        if (match) {
          references.push({
            file: entry.path,
            line: idx + 1,
            content: line.trim(),
            version: match[1],
          });
        }
      });
    }
  }

  return references;
}

async function updateReference(fileSpec: FileSpec, oldVersion: string, newVersion: string): Promise<void> {
  if (fileSpec.path.endsWith('deno.lock')) {
    return; // Skip lock files
  }

  const content = await fileSpec.readAsString();
  const updated = content.replace(new RegExp(`@${oldVersion}`, 'g'), `@${newVersion}`);
  await fileSpec.write(updated);
}

async function main() {
  const apply = Deno.args.includes('-a') || Deno.args.includes('--apply');
  const help = Deno.args.includes('-h') || Deno.args.includes('--help');

  if (help) {
    console.log(`
Usage: deno run --allow-read --allow-write depupdate.ts [options]

Options:
  -a, --apply    Update outdated dependencies
  -h, --help     Show this help message
`);
    return;
  }

  const rootSpec = new FolderSpec(Deno.cwd());
  const rootDeno = new FileSpec(rootSpec, 'deno.json');
  const denoJson = (await rootDeno.readJson()) as DenoJson;

  if (!denoJson.workspace) {
    console.error('No workspaces found in root deno.json');
    return;
  }

  const packages = await findWorkspaces(denoJson.workspace, rootSpec);

  for (const pkg of packages) {
    console.log(`\nChecking ${pkg.name}@${pkg.version}`);
    const references = await findReferences(pkg, rootSpec);

    const outdated = references.filter((ref) => ref.version !== pkg.version);
    if (outdated.length === 0) {
      console.log('✓ All references are up to date');
      continue;
    }

    console.log('\nOutdated references found:');
    for (const ref of outdated) {
      console.log(`  ${ref.file}:${ref.line} (${ref.version} -> ${pkg.version})`);

      if (apply) {
        const fileSpec = new FileSpec(ref.file);
        if (fileSpec.path.endsWith('deno.lock')) {
          console.log('  ⚠️  Skipping deno.lock - please regenerate it manually');
        } else {
          await updateReference(fileSpec, ref.version, pkg.version);
          console.log('  ✓ Updated');
        }
      }
    }
  }

  if (apply) {
    console.log("\n⚠️  Please run 'deno cache --reload' to update deno.lock files");
  }
}

if (import.meta.main) {
  main().catch((err) => {
    console.error('Error:', err);
    Deno.exit(1);
  });
}
