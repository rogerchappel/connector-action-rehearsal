#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { formatJson, formatMarkdown } from "./format.js";
import { createPlan } from "./planner.js";
import { parseFixture } from "./schema.js";
import type { Risk } from "./types.js";

interface CliOptions {
  command?: string;
  fixture?: string;
  format: "json" | "markdown";
  failOn: Risk;
  failOnValidation: "off" | "warning" | "error";
}

async function main(argv: string[]): Promise<number> {
  const options = parseArgs(argv);
  if (options.command !== "plan" || !options.fixture) {
    printHelp();
    return 2;
  }

  const fixture = parseFixture(JSON.parse(await readFile(resolve(options.fixture), "utf8")));
  const plan = createPlan(fixture);
  process.stdout.write(options.format === "json" ? formatJson(plan) : formatMarkdown(plan));
  return shouldFail(plan.risk, options.failOn) || shouldFailValidation(plan, options.failOnValidation) ? 1 : 0;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    command: argv[0],
    fixture: argv[1],
    format: "markdown",
    failOn: "forbidden",
    failOnValidation: "error"
  };
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--format" && (next === "json" || next === "markdown")) {
      options.format = next;
      index += 1;
    } else if (arg === "--fail-on" && isRisk(next)) {
      options.failOn = next;
      index += 1;
    } else if (arg === "--fail-on-validation" && isValidationGate(next)) {
      options.failOnValidation = next;
      index += 1;
    }
  }
  return options;
}

function isRisk(value: string | undefined): value is Risk {
  return value === "read-only" || value === "draft-only" || value === "write-after-approval" || value === "forbidden";
}

function shouldFail(risk: Risk, failOn: Risk): boolean {
  const rank = { "read-only": 1, "draft-only": 2, "write-after-approval": 3, forbidden: 4 };
  return rank[risk] >= rank[failOn];
}

function isValidationGate(value: string | undefined): value is CliOptions["failOnValidation"] {
  return value === "off" || value === "warning" || value === "error";
}

function shouldFailValidation(plan: { validation: Array<{ severity: "warning" | "error" }> }, gate: CliOptions["failOnValidation"]): boolean {
  if (gate === "off") {
    return false;
  }
  if (gate === "warning") {
    return plan.validation.length > 0;
  }
  return plan.validation.some((issue) => issue.severity === "error");
}

function printHelp(): void {
  process.stderr.write(`Usage: connector-action-rehearsal plan <fixture.json> [--format json|markdown] [--fail-on read-only|draft-only|write-after-approval|forbidden] [--fail-on-validation off|warning|error]\n`);
}

main(process.argv.slice(2))
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
