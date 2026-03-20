const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const test = require("node:test");
const { createInitFixture } = require("./init-test-helpers");

const execFileAsync = promisify(execFile);
const cliEntry = path.join(__dirname, "..", "dist", "index.js");

test("Build prints the codex bootstrap prompt after a successful build", async () => {
  const fixture = await createInitFixture();

  await execFileAsync(process.execPath, [
    cliEntry,
    "init",
    "--project-path",
    fixture.projectPath,
    "--kb-path",
    fixture.knowledgeBasePath,
    "--agent-path",
    fixture.agentPath,
    "--agent-persona",
    "software-developer",
  ]);

  const { stderr, stdout } = await execFileAsync(process.execPath, [
    cliEntry,
    "build",
    "--tool",
    "codex",
    "--project-path",
    fixture.projectPath,
  ]);

  assert.equal(stderr, "");
  assert.match(
    stdout,
    /Build complete\. Generated \.aie-os\/build\/effective-context\.json and AGENTS\.md\./u,
  );
  assert.match(stdout, /Bootstrap prompt:/u);
  assert.match(
    stdout,
    /Read `AGENTS\.md` at the repo root and treat it as the authoritative instruction set/u,
  );
  assert.match(
    stdout,
    /reload `AGENTS\.md` from disk before continuing instead of relying on memory\./u,
  );

  await fs.access(path.join(fixture.projectPath, "AGENTS.md"));
  await fs.access(path.join(fixture.projectPath, ".aie-os", "build", "effective-context.json"));
});
