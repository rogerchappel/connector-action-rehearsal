#!/usr/bin/env bash
set -euo pipefail

npm run check
npm test
npm run smoke
node dist/src/cli.js plan fixtures/crm-note.json --format json --fail-on forbidden
npm run package:smoke
