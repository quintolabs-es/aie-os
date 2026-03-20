const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const {
  parseCommandInput,
  resolveExecutionOptions,
} = require(path.join(__dirname, "..", "dist", "commands", "commandLine.js"));

test("Init defaults are fixed project-local content paths", () => {
  const executionOptions = resolveExecutionOptions(parseCommandInput(["init"]), "/tmp/example-project");

  assert.equal(executionOptions.command, "init");
  assert.deepEqual(executionOptions.defaults, {
    agentPath: "content/agent",
    kbPath: "content/knowledge-base",
    skillsPath: "content/skills",
  });
  assert.equal(executionOptions.mode, "interactive");
  assert.doesNotMatch(JSON.stringify(executionOptions.defaults), /aie-os/u);
});

test("Init defaults stay the same when --project-path is provided", () => {
  const executionOptions = resolveExecutionOptions(
    parseCommandInput(["init", "--project-path", "./nested/project"]),
    "/tmp/workspace",
  );

  assert.equal(executionOptions.command, "init");
  assert.equal(executionOptions.projectPath, "/tmp/workspace/nested/project");
  assert.deepEqual(executionOptions.defaults, {
    agentPath: "content/agent",
    kbPath: "content/knowledge-base",
    skillsPath: "content/skills",
  });
});
