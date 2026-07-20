import test from "node:test";
import assert from "node:assert/strict";
import { auditToolRegistry, extractToolDefinitions } from "../scripts/audit-tool-registry.mjs";

test("every registered tool has a unique canonical category route", () => {
  const tools = extractToolDefinitions();
  assert.ok(tools.length >= 60, "expected the complete production registry");
  assert.equal(new Set(tools.map((tool) => tool.href)).size, tools.length);
  for (const tool of tools) {
    assert.equal(tool.href, `/tools/${tool.category}/${tool.slug}`);
  }
});

test("all tool routes map to a processor and SEO-safe route infrastructure", () => {
  const report = auditToolRegistry();
  assert.deepEqual(report.failures, []);
  assert.equal(report.dedicated + report.extended, report.tools);
});
