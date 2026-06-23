# connector-action-rehearsal

`connector-action-rehearsal` turns connector write intentions into deterministic dry-run approval plans. It is designed for agent builders who need local evidence before writing to CRMs, project managers, inboxes, or publishing surfaces.

## Quickstart

```bash
npm install
npm run build
node dist/src/cli.js plan fixtures/meeting-followup.json --format markdown
```

## CLI

```bash
connector-action-rehearsal plan fixtures/meeting-followup.json --format markdown
connector-action-rehearsal plan fixtures/crm-note.json --format json --fail-on forbidden
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
    "title": "Implementation blockers"
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

## Limitations

This CLI does not execute connector actions, validate credentials, or guarantee rollback. It produces a clear artifact for review and approval.

## Safety Notes

Keep live connector writes in a separate approved workflow. Treat generated plans as evidence, not permission.
