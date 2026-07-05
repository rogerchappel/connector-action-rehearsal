# Release Candidate Notes

## Classification

Ship.

## Evidence

- Fixture schema covers supported V1 action types.
- Planner creates deterministic risk, approval, payload preview, evidence, and rollback sections.
- Contact lookup fixtures are classified as `read-only` with no write approval requirement.
- Action-specific payload validation catches incomplete contact lookup, task, CRM, follow-up, email draft, and project update fixtures.
- CLI validation gate can fail CI on validation warnings or errors without executing connector actions.
- Reviewer checklist marks payload validation, evidence trace, approval boundary, approver trace, and rollback gates as `satisfied`, `required`, or `blocked`.
- Write-after-approval fixtures now warn when `approval.approver` is missing, giving handoffs an explicit human owner before any external write workflow.
- GitHub Actions CI runs check, test, smoke, and validation on `main`, release-candidate branches, and PRs.
- Validation script runs check, test, smoke, and JSON output smoke.

## Verification Log

- `npm run validate` passed on 2026-06-25.
- `npm run check` passed on 2026-06-25.
- `npm run build` passed on 2026-06-25.
- `npm test` passed with 8 tests on 2026-06-25.
- `npm run smoke` produced a Markdown plan for `fixtures/meeting-followup.json`.
- `node dist/src/cli.js plan fixtures/crm-note.json --format json --fail-on forbidden` passed with `write-after-approval` risk.
- `node dist/src/cli.js plan fixtures/missing-payload-field.json --fail-on-validation error` exits non-zero after printing diagnostics.
- `node dist/src/cli.js plan fixtures/project-update-missing-approver.json --fail-on-validation warning` exits non-zero after printing the missing approver warning.
- `npm test` passed with 9 tests on 2026-07-05 after adding read-only contact lookup rehearsal.
- `npm run validate` passed on 2026-07-05.

## Known Limits

- This project rehearses connector writes; it does not execute them.
- Risk rules are intentionally conservative and fixture-driven.
- Validation errors are reported in plans and can fail the CLI, but do not rewrite fixtures or call connectors.
- Checklist gates are review aids; they do not grant approval or execute connector writes.
- Rollback notes are operator guidance, not executable automation.
