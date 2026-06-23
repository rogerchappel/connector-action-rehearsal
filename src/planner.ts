import type { ActionFixture, RehearsalPlan, Risk } from "./types.js";

const RISK_BY_ACTION: Record<ActionFixture["action"], Risk> = {
  crm_note: "write-after-approval",
  task_create: "write-after-approval",
  meeting_followup: "draft-only",
  email_draft: "draft-only",
  project_update: "write-after-approval"
};

const FORBIDDEN_CONNECTOR_TERMS = ["prod-delete", "payment-charge", "credential-store"];

export function createPlan(fixture: ActionFixture): RehearsalPlan {
  const warnings: string[] = [];
  let risk = RISK_BY_ACTION[fixture.action];

  if (FORBIDDEN_CONNECTOR_TERMS.some((term) => fixture.connector.includes(term))) {
    risk = "forbidden";
    warnings.push("Connector route matches a forbidden live-write surface.");
  }

  if (fixture.approval?.required === false && risk === "write-after-approval") {
    warnings.push("Write action fixture disabled approval; approval has been re-required in the plan.");
  }

  const approvalRequired = risk === "write-after-approval" || risk === "forbidden" || fixture.approval?.required === true;
  const rollback = fixture.rollback ?? defaultRollback(risk);
  const summary = `${fixture.actor} proposes ${fixture.action} on ${fixture.connector} for ${fixture.target}: ${fixture.reason}`;

  return {
    id: fixture.id,
    connector: fixture.connector,
    action: fixture.action,
    risk,
    approvalRequired,
    summary,
    payloadPreview: fixture.payload,
    approvalPrompt: buildApprovalPrompt(fixture, risk, approvalRequired, rollback),
    rollback,
    evidence: fixture.evidence ?? [],
    warnings
  };
}

function buildApprovalPrompt(fixture: ActionFixture, risk: Risk, approvalRequired: boolean, rollback: string): string {
  const approver = fixture.approval?.approver ?? "the responsible human operator";
  if (risk === "forbidden") {
    return `Do not execute ${fixture.action} on ${fixture.connector}. Ask ${approver} to choose a safer route. Rollback note: ${rollback}`;
  }
  if (!approvalRequired) {
    return `Draft only: review the ${fixture.action} payload for ${fixture.target}. No external write is approved.`;
  }
  return `Approve before writing to ${fixture.connector}: ${fixture.action} for ${fixture.target}. Approver: ${approver}. Rollback note: ${rollback}`;
}

function defaultRollback(risk: Risk): string {
  if (risk === "draft-only") {
    return "Discard the draft; no external record has been changed.";
  }
  if (risk === "forbidden") {
    return "No execution allowed; keep fixture as evidence and redesign the route.";
  }
  return "Use the connector's native audit log to remove or annotate the created record.";
}
