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

test("Build defaults to no forced overwrite when options are omitted", () => {
  const executionOptions = resolveExecutionOptions(parseCommandInput(["build"]), "/tmp/example-project");

  assert.equal(executionOptions.command, "build");
  assert.equal(executionOptions.projectPath, "/tmp/example-project");
  assert.equal(executionOptions.forceOverwrite, false);
});

test("Build accepts the force-overwrite flag", () => {
  const executionOptions = resolveExecutionOptions(
    parseCommandInput(["build", "--force-overwrite"]),
    "/tmp/example-project",
  );

  assert.equal(executionOptions.forceOverwrite, true);
});

test("Init parses a comma-separated --tool list", () => {
  const executionOptions = resolveExecutionOptions(
    parseCommandInput(["init", "--tool", "claude,codex"]),
    "/tmp/example-project",
  );

  assert.deepEqual(executionOptions.initialSelections.tools, ["claude", "codex"]);
  assert.equal(executionOptions.mode, "explicit");
});

test("Build lists the supported options when an unknown option is passed", () => {
  assert.throws(
    () =>
      resolveExecutionOptions(
        parseCommandInput(["build", "--nope", "value"]),
        "/tmp/example-project",
      ),
    (error) => {
      assert.match(error.message, /Unsupported option\(s\) for build: --nope/u);
      assert.match(error.message, /Supported options: --project-path, --force-overwrite/u);
      return true;
    },
  );
});

test("Explicit init preserves an explicitly empty knowledge-base path in the execution model", () => {
  const executionOptions = resolveExecutionOptions(
    parseCommandInput([
      "init",
      "--project-path",
      "./nested/project",
      "--kb-path",
      "",
      "--agent-path",
      "content/agent",
      "--agent-persona",
      "software-developer",
      "--tool",
      "codex",
    ]),
    "/tmp/workspace",
  );

  assert.equal(executionOptions.command, "init");
  assert.equal(executionOptions.providedPaths.kbPath, "");
});
