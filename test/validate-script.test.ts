import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const script = join(repoRoot, "scripts/validate.sh");
const expected = [
  "npm:run check",
  "npm:test",
  "npm:run smoke",
  "node:dist/src/cli.js plan fixtures/crm-note.json --format json --fail-on forbidden",
  "npm:run package:smoke"
];

async function setup(failOnTest = false) {
  const dir = await mkdtemp(join(tmpdir(), "validate-script-"));
  const log = join(dir, "calls");
  await mkdir(join(dir, "bin"));
  const shim = (name: string) => `#!/bin/sh\nprintf '%s:%s\\n' '${name}' "$*" >> ${JSON.stringify(log)}\n${failOnTest && name === "npm" ? "[ \"$*\" != 'test' ] || exit 17\n" : ""}`;
  await writeFile(join(dir, "bin", "npm"), shim("npm"), { mode: 0o755 });
  await writeFile(join(dir, "bin", "node"), shim("node"), { mode: 0o755 });
  return { dir, log };
}

test("validate.sh runs the real ordered commands with exact arguments", async () => {
  const { dir, log } = await setup();
  const result = spawnSync("bash", [script], { cwd: dir, encoding: "utf8", env: { ...process.env, PATH: `${join(dir, "bin")}:${process.env.PATH}` } });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual((await readFile(log, "utf8")).trim().split("\n"), expected);
});

test("validate.sh stops at the first failing validation command", async () => {
  const { dir, log } = await setup(true);
  const result = spawnSync("bash", [script], { cwd: dir, encoding: "utf8", env: { ...process.env, PATH: `${join(dir, "bin")}:${process.env.PATH}` } });
  assert.equal(result.status, 17);
  assert.deepEqual((await readFile(log, "utf8")).trim().split("\n"), ["npm:run check", "npm:test"]);
});
