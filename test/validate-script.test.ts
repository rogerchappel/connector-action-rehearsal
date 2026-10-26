import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const script = resolve("scripts/validate.sh");

test("validate.sh completes when each validation step succeeds", async () => {
  const dir = await mkdtemp(join(tmpdir(), "validate-success-"));
  const log = join(dir, "calls");
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));
  const shim = `#!/bin/sh\nprintf '%s\\n' "$*" >> ${JSON.stringify(log)}\n`;
  await mkdir(join(dir, "bin"));
  await mkdir(join(dir, "node_modules"));
  await writeFile(join(dir, "bin", "npm"), shim, { mode: 0o755 });
  await writeFile(join(dir, "bin", "node"), shim, { mode: 0o755 });
  await writeFile(join(dir, "package.json"), JSON.stringify(packageJson));


  const result = spawnSync("bash", [script], {
    cwd: dir,
    encoding: "utf8",
    env: { ...process.env, PATH: `${join(dir, "bin")}:${process.env.PATH}` }
  });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual((await readFile(log, "utf8")).trim().split("\n"), [
    "test", "run smoke", "dist/src/cli.js plan fixtures/crm-note.json --format json --fail-on forbidden", "run package:smoke"
  ]);
});

test("validate.sh stops at the first failing validation command", async () => {
  const dir = await mkdtemp(join(tmpdir(), "validate-failure-"));
  const log = join(dir, "calls");
  const shim = `#!/bin/sh\nprintf '%s\\n' "$*" >> ${JSON.stringify(log)}\n[ "$*" != 'test' ] || exit 17\n`;
  await mkdir(join(dir, "bin"));
  await mkdir(join(dir, "node_modules"));
  await writeFile(join(dir, "bin", "npm"), shim, { mode: 0o755 });
  await writeFile(join(dir, "bin", "node"), shim, { mode: 0o755 });

  const result = spawnSync("bash", [script], {
    cwd: dir,
    encoding: "utf8",
    env: { ...process.env, PATH: `${join(dir, "bin")}:${process.env.PATH}` }
  });
  assert.equal(result.status, 17);
  assert.deepEqual((await readFile(log, "utf8")).trim().split("\n"), ["test"]);
});
