# connector-action-rehearsal

`connector-action-rehearsal` turns connector write intentions into deterministic dry-run approval plans. It is designed for agent builders who need local evidence before writing to CRMs, project managers, inboxes, or publishing surfaces.

## Quickstart

```bash
npm install
npm run release:check
```

## CLI

```bash
connector-action-rehearsal plan fixtures/meeting-followup.json --format markdown
connector-action-rehearsal plan fixtures/crm-note.json --format json --fail-on forbidden
connector-action-rehearsal plan fixtures/task-create.json --fail-on-validation warning
connector-action-rehearsal plan fixtures/project-update-missing-approver.json --fail-on-validation warning
```

## Fixture Shape

```json
{
  "id": "crm-note-001",
  "connector": "hubspot-notes",
  "action": "crm_note",
  "actor": "agent",
  "target": "ExampleCo opportunity",
  "reason": "Record reviewed implementation blockers.",
  "payload": {
    "title": "Implementation blockers",
    "body": "Customer asked for a security questionnaire before pilot approval."
  },
  "evidence": ["notes/example.md"],
  "approval": {
    "required": true,
    "approver": "sales operations"
  }
}
```

## Risk Levels

- `read-only`: no write proposed.
- `draft-only`: local or connector draft, no external send.
- `write-after-approval`: external mutation requires explicit approval.
- `forbidden`: route should not be executed.

## Payload Validation

The planner checks required payload fields for each supported action and includes validation diagnostics in Markdown and JSON output.

- `crm_note`: `title`, `body`
- `task_create`: `title`, `assignee`, `due`
- `meeting_followup`: `recipient`, `subject`, `body`
- `email_draft`: `recipient`, `subject`, `body`
- `project_update`: `project`, `status`, `summary`

Incomplete payloads are still rendered so reviewers can see the proposed action, but plans with validation errors must not be executed.

Use `--fail-on-validation error` to make malformed fixtures fail CI while still printing the plan. Use `--fail-on-validation warning` for stricter release gates that require evidence paths. Use `--fail-on-validation off` only during exploratory authoring when an agent is still shaping the fixture.

## Reviewer Checklist

Every plan includes a reviewer checklist with four gates:

- payload validation
- evidence trace
- approval boundary
- approver trace
- rollback note

Checklist items are marked `satisfied`, `required`, or `blocked`. A `blocked` item means the connector action must not leave rehearsal. A `required` item means a reviewer needs to confirm or supply the missing context before execution in a separate approved workflow.

Write-after-approval fixtures should name `approval.approver`. Missing approver metadata is a warning by default and can fail stricter CI gates with `--fail-on-validation warning`.

## Limitations

This CLI does not execute connector actions, validate credentials, or guarantee rollback. It produces a clear artifact for review and approval.

## Safety Notes

Keep live connector writes in a separate approved workflow. Treat generated plans as evidence, not permission.

## Release Verification

```bash
npm run check
npm test
npm run smoke
npm run package:smoke
npm run release:check
```

`npm run package:smoke` builds the package, dry-runs `npm pack`, and asserts
that the CLI, planner runtime, fixtures, skill file, docs, README, and license
and security policy are present in the tarball.
