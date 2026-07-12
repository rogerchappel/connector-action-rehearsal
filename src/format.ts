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
    `Decision: ${plan.decision}`,
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

  lines.push("", "## Reviewer Checklist", "");
  lines.push("| Status | Gate | Detail |", "|---|---|---|");
  for (const item of plan.checklist) {
    lines.push(`| ${item.status} | ${item.label} | ${item.detail} |`);
  }

  if (plan.validation.length > 0) {
    lines.push("", "## Validation", "");
    lines.push("| Severity | Field | Issue |", "|---|---|---|");
    for (const issue of plan.validation) {
      lines.push(`| ${issue.severity} | ${issue.field} | ${issue.message} |`);
    }
  }

  lines.push("");
  return lines.join("\n");
}
