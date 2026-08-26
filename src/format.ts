import type { RehearsalPlan } from "./types.js";

export function formatJson(plan: RehearsalPlan): string {
  return `${JSON.stringify(plan, null, 2)}\n`;
}

function markdownText(value: string): string {
  return value
    .replace(/\s*[\r\n]+\s*/g, " ")
    .replace(/([\\`*{}\[\]()<>#+\-.!_|~])/g, "\\$1");
}

export function formatMarkdown(plan: RehearsalPlan): string {
  const lines = [
    "# Connector Action Rehearsal",
    "",
    `ID: ${markdownText(plan.id)}`,
    `Connector: ${markdownText(plan.connector)}`,
    `Action: ${markdownText(plan.action)}`,
    `Risk: ${markdownText(plan.risk)}`,
    `Decision: ${markdownText(plan.decision)}`,
    `Approval required: ${plan.approvalRequired ? "yes" : "no"}`,
    "",
    "## Summary",
    "",
    markdownText(plan.summary),
    "",
    "## Approval Prompt",
    "",
    markdownText(plan.approvalPrompt),
    "",
    "## Payload Preview",
    "",
    "```json",
    JSON.stringify(plan.payloadPreview, null, 2),
    "```",
    "",
    "## Rollback",
    "",
    markdownText(plan.rollback),
    "",
    "## Evidence",
    ""
  ];

  if (plan.evidence.length === 0) {
    lines.push("- None supplied");
  } else {
    lines.push(...plan.evidence.map((item) => `- ${markdownText(item)}`));
  }

  if (plan.warnings.length > 0) {
    lines.push("", "## Warnings", "", ...plan.warnings.map((item) => `- ${markdownText(item)}`));
  }

  lines.push("", "## Reviewer Checklist", "");
  lines.push("| Status | Gate | Detail |", "|---|---|---|");
  for (const item of plan.checklist) {
    lines.push(`| ${markdownText(item.status)} | ${markdownText(item.label)} | ${markdownText(item.detail)} |`);
  }

  if (plan.validation.length > 0) {
    lines.push("", "## Validation", "");
    lines.push("| Severity | Field | Issue |", "|---|---|---|");
    for (const issue of plan.validation) {
      lines.push(`| ${markdownText(issue.severity)} | ${markdownText(issue.field)} | ${markdownText(issue.message)} |`);
    }
  }

  lines.push("");
  return lines.join("\n");
}
