import type { ActionFixture, ActionType } from "./types.js";

const ACTIONS = new Set<ActionType>(["crm_note", "task_create", "meeting_followup", "email_draft", "project_update"]);

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

  return {
    id: asString(value.id, "id"),
    connector: asString(value.connector, "connector"),
    action: value.action as ActionType,
    actor: asString(value.actor, "actor"),
    target: asString(value.target, "target"),
    reason: asString(value.reason, "reason"),
    payload: value.payload,
    evidence: Array.isArray(value.evidence) ? value.evidence.map(String) : [],
    rollback: typeof value.rollback === "string" ? value.rollback : undefined,
    approval: isRecord(value.approval)
      ? {
          required: Boolean(value.approval.required),
          approver: typeof value.approval.approver === "string" ? value.approval.approver : undefined
        }
      : undefined
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
