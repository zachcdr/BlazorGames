import { existsSync, readdirSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { build } from 'vite';

// Builds Scrollfall to be served from a sub-path of another site, straight into that site's folder.
// Usage: npm run publish:to -- <target dir> [--base /scrollfall/]
//   e.g. npm run publish:to -- ../MyBlazorApp/wwwroot/scrollfall
// The target is emptied first, so it must be a folder dedicated to Scrollfall: its name has to
// match the last segment of the base path (here "scrollfall"), or the script refuses.

async function main() {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2).filter((a) => a !== '--'),
    options: { base: { type: 'string', default: '/scrollfall/' } },
    allowPositionals: true,
  });
  const target = positionals[0];
  if (!target) throw new Error('Pass the target folder, e.g. ../MyBlazorApp/wwwroot/scrollfall');

  // Git Bash rewrites "/scrollfall/" into "C:/Program Files/Git/scrollfall/"; pass "--base scrollfall" there.
  if ((values.base ?? '').includes(':')) throw new Error(`--base looks like a file path (${values.base}); pass it without the leading slash, e.g. --base scrollfall`);
  const base = `/${(values.base ?? '').replace(/^\/+|\/+$/g, '')}/`;
  const outDir = resolve(target);
  const folder = base.split('/').filter(Boolean).pop() ?? '';
  if (basename(outDir).toLowerCase() !== folder.toLowerCase()) {
    throw new Error(`Refusing to empty ${outDir}: its name should be "${folder}" to match the base path ${base}`);
  }
  if (existsSync(outDir) && readdirSync(outDir).length > 0 && !existsSync(resolve(outDir, 'index.html'))) {
    throw new Error(`Refusing to empty ${outDir}: it has files but no index.html, so it doesn't look like a previous Scrollfall build`);
  }

  await build({ base, logLevel: 'warn', build: { outDir, emptyOutDir: true } });
  console.log(`Built Scrollfall for ${base} into ${outDir}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
