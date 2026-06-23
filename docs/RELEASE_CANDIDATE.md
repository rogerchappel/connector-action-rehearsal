# Release Candidate Notes

## Classification

Ship.

## Evidence

- Fixture schema covers supported V1 action types.
- Planner creates deterministic risk, approval, payload preview, evidence, and rollback sections.
- Validation script runs check, test, smoke, and JSON output smoke.

## Verification Log

- `npm run validate` passed on 2026-06-24.
- `npm run check` passed.
- `npm test` passed with 3 tests.
- `npm run smoke` produced a Markdown plan for `fixtures/meeting-followup.json`.
- `node dist/src/cli.js plan fixtures/crm-note.json --format json --fail-on forbidden` passed with `write-after-approval` risk.

## Known Limits

- This project rehearses connector writes; it does not execute them.
- Risk rules are intentionally conservative and fixture-driven.
- Rollback notes are operator guidance, not executable automation.
