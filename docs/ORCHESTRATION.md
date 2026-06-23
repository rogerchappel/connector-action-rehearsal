# Orchestration

Use this skill before any agent proposes connector writes to CRMs, project managers, inboxes, or publishing tools.

1. Capture the intended action in a local JSON fixture.
2. Run `connector-action-rehearsal plan <fixture> --format markdown`.
3. Review the risk level and approval prompt.
4. Attach the plan to the handoff, PR, or approval request.
5. Execute live connector actions only through a separate approved workflow.

The CLI never calls external services and never handles credentials.
