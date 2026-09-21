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

test("Build defaults to AGENTS.md and no forced overwrite when options are omitted", () => {
  const executionOptions = resolveExecutionOptions(parseCommandInput(["build"]), "/tmp/example-project");

  assert.equal(executionOptions.command, "build");
  assert.equal(executionOptions.projectPath, "/tmp/example-project");
  assert.equal(executionOptions.outputFile, "AGENTS.md");
  assert.equal(executionOptions.forceOverwrite, false);
});

test("Build accepts a custom output file and the force-overwrite flag", () => {
  const executionOptions = resolveExecutionOptions(
    parseCommandInput(["build", "--output-file", "CLAUDE.md", "--force-overwrite"]),
    "/tmp/example-project",
  );

  assert.equal(executionOptions.outputFile, "CLAUDE.md");
  assert.equal(executionOptions.forceOverwrite, true);
});

test("Build rejects an output file that is a path instead of a file name", () => {
  for (const outputFile of ["docs/AGENTS.md", "../AGENTS.md", ".."]) {
    assert.throws(
      () =>
        resolveExecutionOptions(
          parseCommandInput(["build", "--output-file", outputFile]),
          "/tmp/example-project",
        ),
      /expected a file name, not a path/u,
    );
  }
});

test("Build explains how to replace the removed target-agent option", () => {
  assert.throws(
    () =>
      resolveExecutionOptions(
        parseCommandInput(["build", "--target-agent", "claude"]),
        "/tmp/example-project",
      ),
    (error) => {
      assert.match(error.message, /--target-agent has been removed\. Use --output-file <name> instead\./u);
      assert.match(error.message, /build --output-file CLAUDE\.md/u);
      return true;
    },
  );
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
      assert.match(error.message, /Supported options: --project-path, --output-file, --force-overwrite/u);
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
    ]),
    "/tmp/workspace",
  );

  assert.equal(executionOptions.command, "init");
  assert.equal(executionOptions.providedPaths.kbPath, "");
});
