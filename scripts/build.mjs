import { rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(scriptDir);

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

rmSync(resolve(repoRoot, 'dist'), { force: true, recursive: true });
rmSync(resolve(repoRoot, 'dist-cjs'), { force: true, recursive: true });

run('tsc', ['-p', 'tsconfig.json']);
run('tsc', ['-p', 'tsconfig.cjs.json']);

writeFileSync(
  resolve(repoRoot, 'dist-cjs/package.json'),
  '{\n  "type": "commonjs"\n}\n',
);
