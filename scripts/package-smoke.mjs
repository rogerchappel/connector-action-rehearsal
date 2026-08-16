import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const sandbox = mkdtempSync(join(tmpdir(), "connector-action-rehearsal-package-"));

try {
  const output = execFileSync("npm", ["pack", "--json", "--pack-destination", sandbox], {
    encoding: "utf8"
  });
  const [pack] = JSON.parse(output);
  const files = new Set(pack.files.map((file) => file.path));

  const required = [
    "dist/src/cli.js",
    "dist/src/planner.js",
    "fixtures/meeting-followup.json",
    "fixtures/crm-note.json",
    "SKILL.md",
    "README.md",
    "docs/PRD.md",
    "docs/TASKS.md",
    "LICENSE",
    "SECURITY.md",
    "CHANGELOG.md"
  ];

  const missing = required.filter((file) => !files.has(file));
  assert.deepEqual(missing, [], `Package is missing files:\n${missing.join("\n")}`);

  const tarball = join(sandbox, pack.filename);
  const installPrefix = join(sandbox, "installed");
  execFileSync("npm", ["install", "--prefix", installPrefix, "--ignore-scripts", tarball], {
    encoding: "utf8",
    stdio: "pipe"
  });

  const bin = join(installPrefix, "node_modules", ".bin", "connector-action-rehearsal");
  const fixture = join(
    installPrefix,
    "node_modules",
    "connector-action-rehearsal",
    "fixtures",
    "meeting-followup.json"
  );
  assert.doesNotThrow(() => readFileSync(bin), "Installed package did not expose its CLI bin");

  const plan = spawnSync(bin, ["plan", fixture, "--format", "markdown", "--fail-on", "forbidden"], {
    encoding: "utf8"
  });
  assert.equal(plan.status, 0, plan.stderr);
  assert.match(plan.stdout, /# Connector Action Rehearsal/);
  assert.match(plan.stdout, /Risk: draft\\-only/);
  assert.equal(plan.stderr, "");

  const help = spawnSync(bin, [], { encoding: "utf8" });
  assert.equal(help.status, 2);
  assert.equal(help.stdout, "");
  assert.match(help.stderr, /Usage: connector-action-rehearsal plan/);

  console.log(
    `package smoke ok: installed ${pack.filename}, ran its CLI plan, and verified help exit ${help.status}`
  );
} finally {
  rmSync(sandbox, { recursive: true, force: true });
}
