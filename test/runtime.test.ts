import assert from "node:assert/strict";
import test from "node:test";
import { nodeVersionError } from "../src/runtime.js";

test("accepts supported Node.js major versions", () => {
  assert.equal(nodeVersionError("v22.0.0"), undefined);
  assert.equal(nodeVersionError("v24.1.2"), undefined);
});

test("rejects older or unparseable Node.js versions with a clear message", () => {
  assert.equal(nodeVersionError("v20.19.0"), "Node.js 22 or newer is required (running v20.19.0).");
  assert.equal(nodeVersionError("unknown"), "Node.js 22 or newer is required (running unknown).");
});
