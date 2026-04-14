import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(scriptDir);
const packageJsonPath = resolve(repoRoot, 'package.json');
const VALID_BUMPS = new Set(['patch', 'minor', 'major']);

function fail(message) {
  console.error(message);
  process.exit(1);
}

function readPackageVersion() {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

  if (typeof packageJson.version !== 'string' || packageJson.version.length === 0) {
    fail('package.json is missing a valid version string.');
  }

  return packageJson.version;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: options.captureOutput ? 'pipe' : 'inherit',
  });

  if (result.status !== 0) {
    if (options.captureOutput) {
      process.stderr.write(result.stdout ?? '');
      process.stderr.write(result.stderr ?? '');
    }

    process.exit(result.status ?? 1);
  }

  return result;
}

function gitStatus() {
  const result = run('git', ['status', '--short'], { captureOutput: true });
  return (result.stdout ?? '').trim();
}

function tagExists(tagName) {
  const result = run('git', ['tag', '--list', tagName], { captureOutput: true });
  return (result.stdout ?? '').trim() === tagName;
}

function getNextStableVersion(version, bump) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);

  if (match == null) {
    fail(`Dry-run only supports stable x.y.z versions, got '${version}'.`);
  }

  const [, majorRaw, minorRaw, patchRaw] = match;
  const major = Number(majorRaw);
  const minor = Number(minorRaw);
  const patch = Number(patchRaw);

  switch (bump) {
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'major':
      return `${major + 1}.0.0`;
    default:
      fail(`Unsupported bump type '${bump}'.`);
  }
}

function handleBump(args) {
  const bump = args[0];
  const dryRun = args.includes('--dry-run');

  if (!VALID_BUMPS.has(bump)) {
    fail(`Expected bump type to be one of: ${[...VALID_BUMPS].join(', ')}.`);
  }

  if (dryRun) {
    const currentVersion = readPackageVersion();
    const nextVersion = getNextStableVersion(currentVersion, bump);
    console.log(`Would bump version from ${currentVersion} to ${nextVersion}.`);
    console.log(`Would create commit message: Release ${nextVersion}`);
    console.log(`Would create tag: v${nextVersion}`);
    return;
  }

  run('npm', ['version', bump, '-m', 'Release %s']);
}

function handleTagCurrent(args) {
  const dryRun = args.includes('--dry-run');
  const version = readPackageVersion();
  const tagName = `v${version}`;

  if (tagExists(tagName)) {
    console.log(`Tag ${tagName} already exists. Nothing to do.`);
    return;
  }

  const status = gitStatus();

  if (dryRun) {
    if (status.length > 0) {
      console.log(`Would create annotated tag ${tagName}, but the current working tree is dirty.`);
      return;
    }

    console.log(`Would create annotated tag ${tagName}.`);
    return;
  }

  if (status.length > 0) {
    fail(`Refusing to tag ${tagName} with a dirty working tree. Commit or stash changes first.`);
  }

  run('git', ['tag', '-a', tagName, '-m', `Release ${tagName}`]);
  console.log(`Created annotated tag ${tagName}.`);
}

const [command, ...args] = process.argv.slice(2);

switch (command) {
  case 'bump':
    handleBump(args);
    break;
  case 'tag-current':
    handleTagCurrent(args);
    break;
  default:
    fail('Usage: node scripts/release.mjs <bump|tag-current> [args]');
}
