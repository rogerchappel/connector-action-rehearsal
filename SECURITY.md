# Security Policy

## Supported Versions

Security fixes are handled on the latest `main` branch and the most recent npm
package version.

## Reporting a Vulnerability

Please report suspected vulnerabilities by opening a private GitHub security
advisory for this repository. Include:

- the affected version or commit
- a minimal rehearsal fixture or command that reproduces the issue
- expected and observed behavior
- any known workaround

Do not include credentials, live connector payloads, private customer data, or
production approval details in public issues.

## Scope

This package is a local rehearsal CLI and reusable skill. It builds dry-run
approval plans from supplied fixtures; it should not execute connector writes,
send messages, publish content, or contact external services as part of normal
operation.
