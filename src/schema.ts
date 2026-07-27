import type { ActionFixture, ActionType } from "./types.js";

const ACTIONS = new Set<ActionType>(["contact_lookup", "crm_note", "task_create", "meeting_followup", "email_draft", "project_update"]);

export function parseFixture(value: unknown): ActionFixture {
  if (!isRecord(value)) {
    throw new Error("Fixture must be a JSON object.");
  }

  const required = ["id", "connector", "action", "actor", "target", "reason", "payload"];
  for (const key of required) {
    if (!(key in value)) {
      throw new Error(`Fixture is missing required field: ${key}`);
    }
  }

  if (typeof value.action !== "string" || !ACTIONS.has(value.action as ActionType)) {
    throw new Error(`Unsupported action: ${String(value.action)}`);
  }

  if (!isRecord(value.payload)) {
    throw new Error("Fixture payload must be an object.");
  }

  const evidence = parseEvidence(value);
  const rollback = parseOptionalString(value, "rollback");
  const approval = parseApproval(value);

  return {
    id: asString(value.id, "id"),
    connector: asString(value.connector, "connector"),
    action: value.action as ActionType,
    actor: asString(value.actor, "actor"),
    target: asString(value.target, "target"),
    reason: asString(value.reason, "reason"),
    payload: value.payload,
    evidence,
    rollback,
    approval
  };
}

function parseEvidence(value: Record<string, unknown>): string[] {
  if (!("evidence" in value)) {
    return [];
  }
  if (!Array.isArray(value.evidence)) {
    throw new Error("Fixture field evidence must be an array of non-empty strings.");
  }
  return value.evidence.map((entry, index) => asString(entry, `evidence[${index}]`));
}

function parseOptionalString(value: Record<string, unknown>, key: string): string | undefined {
  if (!(key in value)) {
    return undefined;
  }
  return asString(value[key], key);
}

function parseApproval(value: Record<string, unknown>): ActionFixture["approval"] {
  if (!("approval" in value)) {
    return undefined;
  }
  if (!isRecord(value.approval)) {
    throw new Error("Fixture field approval must be an object.");
  }
  if (typeof value.approval.required !== "boolean") {
    throw new Error("Fixture field approval.required must be a boolean.");
  }

  return {
    required: value.approval.required,
    approver: parseOptionalString(value.approval, "approver")
  };
}

function asString(value: unknown, key: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Fixture field ${key} must be a non-empty string.`);
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
