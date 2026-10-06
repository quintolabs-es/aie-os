const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { contentPath } = require(path.join(__dirname, "..", "dist", "context", "contentPath.js"));

const repoRoot = path.join(__dirname, "..");
const projectPath = "/tmp/example-project";

test("Content path resolves the bundled keyword to the content shipped with the CLI", () => {
  assert.equal(
    contentPath.resolve(projectPath, "bundled", "agent"),
    path.join(repoRoot, "content", "agent"),
  );
  assert.equal(
    contentPath.resolve(projectPath, " bundled ", "knowledgeBase"),
    path.join(repoRoot, "content", "knowledge-base"),
  );
  assert.equal(fs.existsSync(contentPath.resolve(projectPath, "bundled", "skills")), true);
});

test("Content path resolves custom paths against the project and keeps absolute paths", () => {
  assert.equal(
    contentPath.resolve(projectPath, "my-content/agent", "agent"),
    "/tmp/example-project/my-content/agent",
  );
  assert.equal(contentPath.resolve(projectPath, "/opt/content/agent", "agent"), "/opt/content/agent");
});

test("Content path treats an empty value as disabled", () => {
  assert.equal(contentPath.resolve(projectPath, "", "skills"), null);
  assert.equal(contentPath.resolve(projectPath, "  ", "knowledgeBase"), null);
});

test("Content path references are portable and resolve back to the same file", () => {
  const bundledFile = path.join(repoRoot, "content", "agent", "persona", "software-developer.md");
  const projectFile = path.join(projectPath, "my-content", "agent", "persona.md");
  const outsideFile = "/opt/content/agent/persona.md";

  assert.equal(contentPath.toReference(projectPath, bundledFile), "bundled:agent/persona/software-developer.md");
  assert.equal(contentPath.toReference(projectPath, projectFile), "my-content/agent/persona.md");
  assert.equal(contentPath.toReference(projectPath, outsideFile), outsideFile);

  assert.equal(
    contentPath.toReference(repoRoot, bundledFile),
    "content/agent/persona/software-developer.md",
  );
  assert.equal(
    contentPath.resolve(projectPath, "./bundled", "agent"),
    "/tmp/example-project/bundled",
  );

  for (const filePath of [bundledFile, projectFile, outsideFile]) {
    assert.equal(
      contentPath.fromReference(projectPath, contentPath.toReference(projectPath, filePath)),
      filePath,
    );
  }
});
