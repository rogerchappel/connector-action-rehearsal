# Connector Action Rehearsal

Use this skill when an agent has drafted a connector write action and needs a reviewable dry-run plan before touching an external system.

## Required Inputs

- One local JSON fixture describing the intended connector action.
- Evidence paths or notes that justify the action.
- Optional approver name for write-after-approval actions.

## Side-Effect Boundaries

This skill is rehearsal-only. It reads local fixtures and prints approval plans. It must not send messages, mutate CRMs, create tasks, publish content, store credentials, or call connector APIs.

## Approval Requirements

Any `write-after-approval` action requires explicit user approval outside this CLI. Any `forbidden` action must be redesigned and must not be executed from the generated plan.

## Examples

```bash
connector-action-rehearsal plan fixtures/meeting-followup.json --format markdown
connector-action-rehearsal plan fixtures/crm-note.json --format json --fail-on forbidden
```

## Validation

Run `npm run validate`. Inspect the generated plan's `Validation` section and treat any `error` as a blocker for execution. Include the Markdown plan in handoffs or release-candidate PRs when connector behavior is part of a skill demo.
