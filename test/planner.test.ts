import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { createPlan } from "../src/planner.js";
import { parseFixture } from "../src/schema.js";

function runCli(...args: string[]) {
  return spawnSync(process.execPath, ["dist/src/cli.js", ...args], { encoding: "utf8" });
}

test("creates approval-ready plan for CRM note", async () => {
  const fixture = parseFixture(JSON.parse(await readFile(resolve("fixtures/crm-note.json"), "utf8")));
  const plan = createPlan(fixture);
  assert.equal(plan.risk, "write-after-approval");
  assert.equal(plan.approvalRequired, true);
  assert.equal(plan.decision, "approval-required");
  assert.match(plan.approvalPrompt, /Approve before writing/);
  assert.ok(plan.checklist.some((item) => item.label === "Approval boundary" && item.status === "required"));
  assert.deepEqual(plan.validation, []);
});

test("keeps meeting follow-up as draft-only", async () => {
  const fixture = parseFixture(JSON.parse(await readFile(resolve("fixtures/meeting-followup.json"), "utf8")));
  const plan = createPlan(fixture);
  assert.equal(plan.risk, "draft-only");
  assert.equal(plan.approvalRequired, false);
  assert.equal(plan.decision, "safe-to-review");
  assert.ok(plan.checklist.some((item) => item.label === "Approval boundary" && item.status === "satisfied"));
  assert.deepEqual(plan.validation, []);
});

test("keeps contact lookup read-only", async () => {
  const fixture = parseFixture(JSON.parse(await readFile(resolve("fixtures/contact-lookup.json"), "utf8")));
  const plan = createPlan(fixture);
  assert.equal(plan.risk, "read-only");
  assert.equal(plan.approvalRequired, false);
  assert.equal(plan.decision, "safe-to-review");
  assert.match(plan.approvalPrompt, /Read only/);
  assert.match(plan.rollback, /No rollback needed/);
  assert.ok(plan.checklist.some((item) => item.label === "Approval boundary" && item.status === "satisfied"));
  assert.deepEqual(plan.validation, []);
});

test("blocks forbidden connector routes", async () => {
  const fixture = parseFixture(JSON.parse(await readFile(resolve("fixtures/forbidden.json"), "utf8")));
  const plan = createPlan(fixture);
  assert.equal(plan.risk, "forbidden");
  assert.equal(plan.decision, "blocked");
  assert.ok(plan.warnings.length > 0);
  assert.ok(plan.validation.some((issue) => issue.field === "payload.project"));
  assert.ok(plan.checklist.some((item) => item.status === "blocked"));
});

test("blocks uppercase and mixed-case forbidden connector routes", async () => {
  const baseFixture = JSON.parse(await readFile(resolve("fixtures/project-update-missing-approver.json"), "utf8"));

  for (const connector of ["PAYMENT-CHARGE-PROD-DELETE", "internal-Credential-Store-route"]) {
    const plan = createPlan(parseFixture({ ...baseFixture, connector }));
    assert.equal(plan.risk, "forbidden", connector);
    assert.equal(plan.decision, "blocked", connector);
  }
});

test("validates task creation payloads", async () => {
  const fixture = parseFixture(JSON.parse(await readFile(resolve("fixtures/task-create.json"), "utf8")));
  const plan = createPlan(fixture);
  assert.equal(plan.risk, "write-after-approval");
  assert.equal(plan.decision, "approval-required");
  assert.deepEqual(plan.validation, []);
});

test("requires approver metadata for write-after-approval handoffs", async () => {
  const fixture = parseFixture(JSON.parse(await readFile(resolve("fixtures/project-update-missing-approver.json"), "utf8")));
  const plan = createPlan(fixture);
  assert.equal(plan.risk, "write-after-approval");
  assert.equal(plan.decision, "approval-required");
  assert.ok(plan.validation.some((issue) => issue.field === "approval.approver" && issue.severity === "warning"));
  assert.ok(plan.checklist.some((item) => item.label === "Approver trace" && item.status === "required"));
});

test("reports incomplete payload fields without throwing", async () => {
  const fixture = parseFixture(JSON.parse(await readFile(resolve("fixtures/missing-payload-field.json"), "utf8")));
  const plan = createPlan(fixture);
  assert.equal(plan.risk, "write-after-approval");
  assert.equal(plan.decision, "blocked");
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

test("CLI rejects malformed options instead of silently using permissive defaults", () => {
  const malformedOptions = [
    ["--fail-on", "write-after-approva"],
    ["--fail-on"],
    ["--fail-on-validation", "warn"],
    ["--fail-on-validation"],
    ["--format", "yaml"],
    ["--format"],
    ["--unknown-option"],
    ["unexpected-argument"]
  ];

  for (const option of malformedOptions) {
    const result = runCli("plan", "fixtures/crm-note.json", ...option);
    assert.equal(result.status, 2, option.join(" "));
    assert.equal(result.stdout, "", option.join(" "));
    assert.match(result.stderr, /Usage:/, option.join(" "));
  }
});

test("CLI preserves every documented risk threshold", () => {
  const expectedStatus = new Map([
    ["read-only", 1],
    ["draft-only", 1],
    ["write-after-approval", 1],
    ["forbidden", 0]
  ]);

  for (const [threshold, status] of expectedStatus) {
    const result = runCli(
      "plan",
      "fixtures/crm-note.json",
      "--format",
      "json",
      "--fail-on",
      threshold,
      "--fail-on-validation",
      "off"
    );
    assert.equal(result.status, status, threshold);
    assert.match(result.stdout, /"risk": "write-after-approval"/, threshold);
    assert.equal(result.stderr, "", threshold);
  }
});

test("CLI preserves every documented validation gate", () => {
  const expectedStatus = new Map([
    ["off", 0],
    ["warning", 1],
    ["error", 0]
  ]);

  for (const [gate, status] of expectedStatus) {
    const result = runCli(
      "plan",
      "fixtures/project-update-missing-approver.json",
      "--format",
      "json",
      "--fail-on",
      "forbidden",
      "--fail-on-validation",
      gate
    );
    assert.equal(result.status, status, gate);
    assert.match(result.stdout, /"severity": "warning"/, gate);
    assert.equal(result.stderr, "", gate);
  }
});
