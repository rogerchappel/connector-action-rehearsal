import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createPlan } from "../src/planner.js";
import { parseFixture } from "../src/schema.js";

test("creates approval-ready plan for CRM note", async () => {
  const fixture = parseFixture(JSON.parse(await readFile(resolve("fixtures/crm-note.json"), "utf8")));
  const plan = createPlan(fixture);
  assert.equal(plan.risk, "write-after-approval");
  assert.equal(plan.approvalRequired, true);
  assert.match(plan.approvalPrompt, /Approve before writing/);
});

test("keeps meeting follow-up as draft-only", async () => {
  const fixture = parseFixture(JSON.parse(await readFile(resolve("fixtures/meeting-followup.json"), "utf8")));
  const plan = createPlan(fixture);
  assert.equal(plan.risk, "draft-only");
  assert.equal(plan.approvalRequired, false);
});

test("blocks forbidden connector routes", async () => {
  const fixture = parseFixture(JSON.parse(await readFile(resolve("fixtures/forbidden.json"), "utf8")));
  const plan = createPlan(fixture);
  assert.equal(plan.risk, "forbidden");
  assert.ok(plan.warnings.length > 0);
});
