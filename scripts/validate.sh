#!/usr/bin/env bash
set -euo pipefail

# Keep standalone type checking in release validation; npm test builds before tests.
npm run check
npm test
npm run smoke
node dist/src/cli.js plan fixtures/crm-note.json --format json --fail-on forbidden
npm run package:smoke
