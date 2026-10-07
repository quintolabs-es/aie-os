const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const test = require("node:test");
const { buildFixture, createRichContextFixture } = require("./rich-context-fixture");

test("Codex AGENTS.md stays byte-identical to the single-file rendering", async () => {
  const fixture = await createRichContextFixture("codex");

  await buildFixture(fixture);

  const golden = await fs.readFile(path.join(__dirname, "fixtures", "codex-agents.golden.md"), "utf8");
  const agents = await fs.readFile(path.join(fixture.projectPath, "AGENTS.md"), "utf8");

  assert.equal(agents, golden);
  await assert.rejects(fs.access(path.join(fixture.projectPath, ".claude")));
});
