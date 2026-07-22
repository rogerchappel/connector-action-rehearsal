import type { ActionFixture, RehearsalPlan, Risk, ValidationIssue } from "./types.js";

const RISK_BY_ACTION: Record<ActionFixture["action"], Risk> = {
  contact_lookup: "read-only",
  crm_note: "write-after-approval",
  task_create: "write-after-approval",
  meeting_followup: "draft-only",
  email_draft: "draft-only",
  project_update: "write-after-approval"
};

const FORBIDDEN_CONNECTOR_TERMS = ["prod-delete", "payment-charge", "credential-store"];

export function createPlan(fixture: ActionFixture): RehearsalPlan {
  const warnings: string[] = [];
  const validation = validatePayload(fixture);
  let risk = RISK_BY_ACTION[fixture.action];
  const normalizedConnector = fixture.connector.toLowerCase();

  if (FORBIDDEN_CONNECTOR_TERMS.some((term) => normalizedConnector.includes(term))) {
    risk = "forbidden";
    warnings.push("Connector route matches a forbidden live-write surface.");
  }

  if (fixture.approval?.required === false && risk === "write-after-approval") {
    warnings.push("Write action fixture disabled approval; approval has been re-required in the plan.");
  }

  if (risk === "write-after-approval" && !fixture.approval?.approver) {
    validation.push({
      field: "approval.approver",
      message: "Write-after-approval actions should name the responsible approver.",
      severity: "warning"
    });
  }

  if (validation.some((issue) => issue.severity === "error")) {
    warnings.push("Payload is missing required action fields; do not execute until the fixture is corrected.");
  }

  const approvalRequired = risk === "write-after-approval" || risk === "forbidden" || fixture.approval?.required === true;
  const rollback = fixture.rollback ?? defaultRollback(risk);
  const summary = `${fixture.actor} proposes ${fixture.action} on ${fixture.connector} for ${fixture.target}: ${fixture.reason}`;

  const checklist = buildChecklist(fixture, risk, approvalRequired, validation);

  return {
    id: fixture.id,
    connector: fixture.connector,
    action: fixture.action,
    risk,
    approvalRequired,
    decision: decide(risk, approvalRequired, validation),
    summary,
    payloadPreview: fixture.payload,
    approvalPrompt: buildApprovalPrompt(fixture, risk, approvalRequired, rollback),
    rollback,
    evidence: fixture.evidence ?? [],
    checklist,
    warnings,
    validation
  };
}

function validatePayload(fixture: ActionFixture): ValidationIssue[] {
  const requiredByAction: Record<ActionFixture["action"], string[]> = {
    contact_lookup: ["query"],
    crm_note: ["title", "body"],
    task_create: ["title", "assignee", "due"],
    meeting_followup: ["recipient", "subject", "body"],
    email_draft: ["recipient", "subject", "body"],
    project_update: ["project", "status", "summary"]
  };

  const issues: ValidationIssue[] = [];
  for (const field of requiredByAction[fixture.action]) {
    const value = fixture.payload[field];
    if (typeof value !== "string" || value.trim() === "") {
      issues.push({
        field: `payload.${field}`,
        message: `Expected non-empty ${field} for ${fixture.action}.`,
        severity: "error"
      });
    }
  }

  if (fixture.evidence === undefined || fixture.evidence.length === 0) {
    issues.push({
      field: "evidence",
      message: "No evidence paths were supplied for reviewer traceability.",
      severity: "warning"
    });
  }

  return issues;
}

function buildApprovalPrompt(fixture: ActionFixture, risk: Risk, approvalRequired: boolean, rollback: string): string {
  const approver = fixture.approval?.approver ?? "the responsible human operator";
  if (risk === "forbidden") {
    return `Do not execute ${fixture.action} on ${fixture.connector}. Ask ${approver} to choose a safer route. Rollback note: ${rollback}`;
  }
  if (!approvalRequired) {
    return risk === "read-only"
      ? `Read only: inspect ${fixture.connector} for ${fixture.target}. No external write is approved.`
      : `Draft only: review the ${fixture.action} payload for ${fixture.target}. No external write is approved.`;
  }
  return `Approve before writing to ${fixture.connector}: ${fixture.action} for ${fixture.target}. Approver: ${approver}. Rollback note: ${rollback}`;
}

function buildChecklist(
  fixture: ActionFixture,
  risk: Risk,
  approvalRequired: boolean,
  validation: ValidationIssue[]
): RehearsalPlan["checklist"] {
  const hasEvidence = (fixture.evidence ?? []).length > 0;
  const hasValidationErrors = validation.some((issue) => issue.severity === "error");

  return [
    {
      label: "Payload validation",
      status: hasValidationErrors ? "blocked" : "satisfied",
      detail: hasValidationErrors ? "Fix validation errors before approval or execution." : "Required payload fields are present."
    },
    {
      label: "Evidence trace",
      status: hasEvidence ? "satisfied" : "required",
      detail: hasEvidence ? "Evidence paths were supplied for reviewer traceability." : "Add evidence paths before this plan is used in a handoff."
    },
    {
      label: "Approval boundary",
      status: risk === "forbidden" ? "blocked" : approvalRequired ? "required" : "satisfied",
      detail:
        risk === "forbidden"
          ? "Do not execute this route; redesign the connector action."
          : approvalRequired
            ? "Collect explicit human approval before any connector write."
            : risk === "read-only"
              ? "Read-only connector inspection does not require write approval."
              : "No external write is approved by this draft-only plan."
    },
    {
      label: "Approver trace",
      status: risk === "write-after-approval" && !fixture.approval?.approver ? "required" : "satisfied",
      detail:
        risk === "write-after-approval" && !fixture.approval?.approver
          ? "Name the responsible approver before handing off this write plan."
          : "Approver metadata is either present or not required for this route."
    },
    {
      label: "Rollback note",
      status: fixture.rollback ? "satisfied" : "required",
      detail: fixture.rollback ? "Fixture supplied a rollback note." : "Default rollback guidance was generated; confirm it matches the connector."
    }
  ];
}

function defaultRollback(risk: Risk): string {
  if (risk === "read-only") {
    return "No rollback needed; the plan only inspects connector data.";
  }
  if (risk === "draft-only") {
    return "Discard the draft; no external record has been changed.";
  }
  if (risk === "forbidden") {
    return "No execution allowed; keep fixture as evidence and redesign the route.";
  }
  return "Use the connector's native audit log to remove or annotate the created record.";
}

function decide(risk: Risk, approvalRequired: boolean, validation: ValidationIssue[]): RehearsalPlan["decision"] {
  if (risk === "forbidden" || validation.some((issue) => issue.severity === "error")) {
    return "blocked";
  }
  if (approvalRequired || validation.some((issue) => issue.severity === "warning")) {
    return "approval-required";
  }
  return "safe-to-review";
}
