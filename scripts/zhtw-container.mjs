import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const action = process.argv[2];
if (!['build', 'lint', 'baseline'].includes(action)) {
  console.error('Usage: node scripts/zhtw-container.mjs <build|lint|baseline>');
  process.exit(2);
}

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const checkout = '/home/runner/work/akunzai.github.io/akunzai.github.io';
const options = { cwd: root, shell: false };

const engine = ['podman', 'docker'].find((name) => {
  const probe = spawnSync(name, ['info'], {
    ...options,
    stdio: 'ignore',
    timeout: 10000,
  });
  return probe.status === 0;
});

if (!engine) {
  console.error('Start Podman or Docker, then rerun the zhtw task.');
  process.exit(1);
}

function run(args) {
  const result = spawnSync(engine, args, { ...options, stdio: 'inherit' });
  if (result.error) console.error(result.error.message);
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log(`Using ${engine} for zhtw-mcp.`);
run(['build', '-t', 'zhtw-mcp', '-f', '.zhtw-mcp/Dockerfile', '.']);

if (action !== 'build') {
  const flags = action === 'lint'
    ? ['--max-errors', '0', '--max-warnings', '0']
    : ['--update-baseline'];

  run([
    'run', '--rm', '-v', `${root}:${checkout}`, '-w', checkout,
    'zhtw-mcp', 'lint', 'src/content/docs/zh-tw/',
    '--content-type', 'markdown', '--baseline', '.zhtw-mcp/baseline.json',
    ...flags,
  ]);
}
