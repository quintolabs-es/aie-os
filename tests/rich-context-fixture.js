const fs = require("node:fs/promises");
const path = require("node:path");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const { createInitFixture } = require("./init-test-helpers");

const execFileAsync = promisify(execFile);
const cliEntry = path.join(__dirname, "..", "dist", "index.js");

const sharedFiles = {
  "agent/universal/critical-rules.md": "- Agent critical rule.\n",
  "agent/universal/universal.md": "- Agent rule that always applies.\n",
  "knowledge-base/general-principles/universal/1-engineering-principles.md": "- Ship small and fast.\n",
  "knowledge-base/general-principles/architecture/2-architecture-principles.md": "- Keep boundaries clean.\n",
  "knowledge-base/coding-rules/universal/1-coding-rules.md": "- Keep modules focused.\n",
  "knowledge-base/coding-rules/universal/2-testing-standards.md": "- Test observable behavior.\n",
  "knowledge-base/coding-rules/universal/critical-rules.md": "- Never mutate shared resources in tests.\n",
  "knowledge-base/coding-rules/language/typescript/typescript.md": "- Use strict compiler settings.\n",
};

const projectRuleFiles = {
  "critical-rules.md": "- Confirm backward-incompatible changes.\n",
  "repo-rules.md": "- Keep feature code close together.\n",
  "api/endpoints.md": "- Validate request bodies at the boundary.\n",
};

async function createRichContextFixture(tools) {
  const fixture = await createInitFixture();
  const sharedPath = path.dirname(fixture.agentPath);

  for (const [relativePath, contents] of Object.entries(sharedFiles)) {
    await fs.mkdir(path.dirname(path.join(sharedPath, relativePath)), { recursive: true });
    await fs.writeFile(path.join(sharedPath, relativePath), contents);
  }

  await execFileAsync(process.execPath, [
    cliEntry,
    "init",
    "--project-path",
    fixture.projectPath,
    "--kb-path",
    fixture.knowledgeBasePath,
    "--agent-path",
    fixture.agentPath,
    "--skills-path",
    "",
    "--agent-persona",
    "software-developer",
    "--tool",
    tools,
    "--languages",
    "typescript",
    "--application-type",
    "cli",
    "--frameworks",
    "react",
  ]);

  const projectRulesPath = path.join(fixture.projectPath, ".aie-os", "project-coding-rules");
  for (const [relativePath, contents] of Object.entries(projectRuleFiles)) {
    await fs.mkdir(path.dirname(path.join(projectRulesPath, relativePath)), { recursive: true });
    await fs.writeFile(path.join(projectRulesPath, relativePath), contents);
  }

  return fixture;
}

async function buildFixture(fixture, extraArguments = []) {
  return execFileAsync(process.execPath, [
    cliEntry,
    "build",
    "--project-path",
    fixture.projectPath,
    ...extraArguments,
  ]);
}

module.exports = {
  buildFixture,
  createRichContextFixture,
};
