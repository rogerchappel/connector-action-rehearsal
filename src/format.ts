import type { RehearsalPlan } from "./types.js";

export function formatJson(plan: RehearsalPlan): string {
  return `${JSON.stringify(plan, null, 2)}\n`;
}

export function formatMarkdown(plan: RehearsalPlan): string {
  const lines = [
    "# Connector Action Rehearsal",
    "",
    `ID: ${plan.id}`,
    `Connector: ${plan.connector}`,
    `Action: ${plan.action}`,
    `Risk: ${plan.risk}`,
    `Approval required: ${plan.approvalRequired ? "yes" : "no"}`,
    "",
    "## Summary",
    "",
    plan.summary,
    "",
    "## Approval Prompt",
    "",
    plan.approvalPrompt,
    "",
    "## Payload Preview",
    "",
    "```json",
    JSON.stringify(plan.payloadPreview, null, 2),
    "```",
    "",
    "## Rollback",
    "",
    plan.rollback,
    "",
    "## Evidence",
    ""
  ];

  if (plan.evidence.length === 0) {
    lines.push("- None supplied");
  } else {
    lines.push(...plan.evidence.map((item) => `- ${item}`));
  }

  if (plan.warnings.length > 0) {
    lines.push("", "## Warnings", "", ...plan.warnings.map((item) => `- ${item}`));
  }

  lines.push("");
  return lines.join("\n");
}
