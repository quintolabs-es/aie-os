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
    agentPath: "aie-os/content/agent",
    kbPath: "aie-os/content/knowledge-base",
    skillsPath: "aie-os/content/skills",
  });
  assert.equal(executionOptions.mode, "interactive");
});

test("Init defaults stay the same when --project-path is provided", () => {
  const executionOptions = resolveExecutionOptions(
    parseCommandInput(["init", "--project-path", "./nested/project"]),
    "/tmp/workspace",
  );

  assert.equal(executionOptions.command, "init");
  assert.equal(executionOptions.projectPath, "/tmp/workspace/nested/project");
  assert.deepEqual(executionOptions.defaults, {
    agentPath: "aie-os/content/agent",
    kbPath: "aie-os/content/knowledge-base",
    skillsPath: "aie-os/content/skills",
  });
});

test("Build defaults to the default adapter when --tool is omitted", () => {
  const executionOptions = resolveExecutionOptions(parseCommandInput(["build"]), "/tmp/example-project");

  assert.equal(executionOptions.command, "build");
  assert.equal(executionOptions.projectPath, "/tmp/example-project");
  assert.equal(executionOptions.tool, "default");
});
