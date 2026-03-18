const assert = require("node:assert/strict");
const path = require("node:path");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const test = require("node:test");

const execFileAsync = promisify(execFile);

test("CLI help command prints usage text", async () => {
  const cliEntry = path.join(__dirname, "..", "dist", "index.js");
  const { stdout, stderr } = await execFileAsync(process.execPath, [cliEntry, "--help"]);

  assert.equal(stderr, "");
  assert.match(stdout, /^AIE OS\r?\n/u);
  assert.match(stdout, /Usage:\r?\n/u);
  assert.match(stdout, /build --tool codex/u);
});
