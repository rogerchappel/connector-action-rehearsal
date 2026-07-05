export type ActionType = "contact_lookup" | "crm_note" | "task_create" | "meeting_followup" | "email_draft" | "project_update";
export type Risk = "read-only" | "draft-only" | "write-after-approval" | "forbidden";

export interface ActionFixture {
  id: string;
  connector: string;
  action: ActionType;
  actor: string;
  target: string;
  reason: string;
  payload: Record<string, unknown>;
  evidence?: string[];
  rollback?: string;
  approval?: {
    required: boolean;
    approver?: string;
  };
}

export interface RehearsalPlan {
  id: string;
  connector: string;
  action: ActionType;
  risk: Risk;
  approvalRequired: boolean;
  summary: string;
  payloadPreview: Record<string, unknown>;
  approvalPrompt: string;
  rollback: string;
  evidence: string[];
  checklist: ChecklistItem[];
  warnings: string[];
  validation: ValidationIssue[];
}

export interface ValidationIssue {
  field: string;
  message: string;
  severity: "warning" | "error";
}

export interface ChecklistItem {
  label: string;
  status: "required" | "blocked" | "satisfied";
  detail: string;
}
