import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { createPlan } from "../src/planner.js";
import { parseFixture } from "../src/schema.js";

test("creates approval-ready plan for CRM note", async () => {
  const fixture = parseFixture(JSON.parse(await readFile(resolve("fixtures/crm-note.json"), "utf8")));
  const plan = createPlan(fixture);
  assert.equal(plan.risk, "write-after-approval");
  assert.equal(plan.approvalRequired, true);
  assert.match(plan.approvalPrompt, /Approve before writing/);
  assert.ok(plan.checklist.some((item) => item.label === "Approval boundary" && item.status === "required"));
  assert.deepEqual(plan.validation, []);
});

test("keeps meeting follow-up as draft-only", async () => {
  const fixture = parseFixture(JSON.parse(await readFile(resolve("fixtures/meeting-followup.json"), "utf8")));
  const plan = createPlan(fixture);
  assert.equal(plan.risk, "draft-only");
  assert.equal(plan.approvalRequired, false);
  assert.ok(plan.checklist.some((item) => item.label === "Approval boundary" && item.status === "satisfied"));
  assert.deepEqual(plan.validation, []);
});

test("blocks forbidden connector routes", async () => {
  const fixture = parseFixture(JSON.parse(await readFile(resolve("fixtures/forbidden.json"), "utf8")));
  const plan = createPlan(fixture);
  assert.equal(plan.risk, "forbidden");
  assert.ok(plan.warnings.length > 0);
  assert.ok(plan.validation.some((issue) => issue.field === "payload.project"));
  assert.ok(plan.checklist.some((item) => item.status === "blocked"));
});

test("validates task creation payloads", async () => {
  const fixture = parseFixture(JSON.parse(await readFile(resolve("fixtures/task-create.json"), "utf8")));
  const plan = createPlan(fixture);
  assert.equal(plan.risk, "write-after-approval");
  assert.deepEqual(plan.validation, []);
});

test("reports incomplete payload fields without throwing", async () => {
  const fixture = parseFixture(JSON.parse(await readFile(resolve("fixtures/missing-payload-field.json"), "utf8")));
  const plan = createPlan(fixture);
  assert.equal(plan.risk, "write-after-approval");
  assert.ok(plan.validation.some((issue) => issue.field === "payload.assignee"));
  assert.ok(plan.warnings.some((warning) => warning.includes("Payload is missing")));
  assert.ok(plan.checklist.some((item) => item.label === "Payload validation" && item.status === "blocked"));
});

test("CLI can fail on validation errors before connector execution", () => {
  const result = spawnSync(
    process.execPath,
    [
      "dist/src/cli.js",
      "plan",
      "fixtures/missing-payload-field.json",
      "--format",
      "json",
      "--fail-on",
      "forbidden",
      "--fail-on-validation",
      "error"
    ],
    { encoding: "utf8" }
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /payload.assignee/);
});

test("CLI validation gate can be disabled for exploratory rehearsal", () => {
  const result = spawnSync(
    process.execPath,
    [
      "dist/src/cli.js",
      "plan",
      "fixtures/missing-payload-field.json",
      "--format",
      "json",
      "--fail-on",
      "forbidden",
      "--fail-on-validation",
      "off"
    ],
    { encoding: "utf8" }
  );

  assert.equal(result.status, 0);
  assert.match(result.stdout, /payload.assignee/);
});
