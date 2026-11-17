import { spawnSync } from 'node:child_process';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const app = fileURLToPath(new URL('../', import.meta.url));
const repo = fileURLToPath(new URL('../../', import.meta.url));
const config = JSON.parse(await readFile(join(app, 'app.json'), 'utf8'));
const base = config.expo.experiments.baseUrl + '/';
const dist = join(app, 'dist-pages');
const site = join(repo, 'waystory');

const result = spawnSync(process.execPath, [
  require.resolve('expo/bin/cli'), 'export', '--platform', 'web', '--output-dir', dist,
], { cwd: app, stdio: 'inherit' });
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

await mkdir(site, { recursive: true });
await cp(dist, site, { recursive: true });
const index = await readFile(join(site, 'index.html'), 'utf8');
const restoreRoute = `<script>
  const route = new URLSearchParams(location.search).get('route');
  if (route) {
    const target = new URL(${JSON.stringify(base)} + route, location.origin);
    if (target.origin === location.origin && target.pathname.startsWith(${JSON.stringify(base)})) {
      history.replaceState(null, '', target.pathname + target.search + target.hash);
    }
  }
</script>`;
await writeFile(join(site, 'index.html'), index.replace('<head>', '<head>' + restoreRoute));
await writeFile(join(repo, '.nojekyll'), '');
await writeFile(join(repo, '404.html'), `<!doctype html>
<html lang="en"><meta charset="utf-8"><title>Page not found</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<script>
  const base = ${JSON.stringify(base)};
  if (location.pathname.startsWith(base) && location.pathname !== base) {
    const route = location.pathname.slice(base.length) + location.search + location.hash;
    location.replace(base + '?route=' + encodeURIComponent(route));
  }
</script>
<h1>Page not found</h1><p><a href="${base}">Open WayStory</a></p></html>
`);
