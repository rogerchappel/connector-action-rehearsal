# PRD: connector-action-rehearsal

Status: in-progress
Decision: build now
Updated: 2026-06-24

## Pitch

A reusable agent skill and CLI for rehearsing connector write actions against local fixtures, producing approval-ready plans without touching external accounts.

## V1 Scope

- CLI: `connector-action-rehearsal plan <fixture.json> --format json|markdown`.
- Declarative fixture schema for CRM note, task creation, meeting follow-up, email draft, and project update actions.
- Risk classification for read-only, draft-only, write-after-approval, and forbidden actions.
- Approval prompt generator with exact recipient/system, action summary, payload preview, and rollback note.
- Markdown and JSON outputs suitable for PR bodies or agent handoffs.
- Include `SKILL.md` with use cases, required inputs, side-effect boundaries, approval requirements, examples, and verification.

## Out of Scope

- Live connector execution.
- Credential handling.
- Sending messages, mutating CRMs, or creating tasks.
- Broad workflow automation beyond rehearsal artifacts.
