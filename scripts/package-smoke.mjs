import { execFileSync } from "node:child_process";

const output = execFileSync("npm", ["pack", "--dry-run", "--json"], {
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
if (missing.length) {
  console.error(`Package smoke failed; missing files:\n${missing.join("\n")}`);
  process.exit(1);
}

console.log(`package smoke ok: ${pack.filename} includes ${pack.files.length} files`);
