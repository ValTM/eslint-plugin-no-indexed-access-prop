import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const oxlintBinary = join(projectRoot, "node_modules", ".bin", "oxlint");

test("Oxlint loads the built plugin and reports indexed access types", () => {
  const result = spawnSync(
    oxlintBinary,
    ["-c", "tests/fixtures/.oxlintrc.json", "tests/fixtures/invalid.ts"],
    {
      cwd: projectRoot,
      encoding: "utf8",
    },
  );

  assert.equal(result.status, 1, `Expected Oxlint to fail, got status ${result.status}\n${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout + result.stderr, /Do not use TypeScript indexed access types/);
  assert.match(result.stdout + result.stderr, /no-indexed-access-prop\(no-indexed-access-prop\)/);
});
