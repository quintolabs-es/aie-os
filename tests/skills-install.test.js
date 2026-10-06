const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const test = require("node:test");
const { createInitFixture } = require("./init-test-helpers");

const execFileAsync = promisify(execFile);
const cliEntry = path.join(__dirname, "..", "dist", "index.js");

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function writePersona(fixture, skills) {
  await fs.writeFile(
    path.join(fixture.agentPath, "persona", "software-developer.md"),
    `---\nskills: [${skills.join(", ")}]\n---\n\nYou are a software developer.\n`,
  );
}

async function init(fixture, tools) {
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
    fixture.skillsPath,
    "--agent-persona",
    "software-developer",
    "--tool",
    tools,
  ]);
}

async function build(fixture, extraArguments = []) {
  return execFileAsync(process.execPath, [
    cliEntry,
    "build",
    "--project-path",
    fixture.projectPath,
    ...extraArguments,
  ]);
}

test("Build installs persona skills and commands for claude without the codex metadata", async () => {
  const fixture = await createInitFixture();
  await writePersona(fixture, ["skill-a"]);
  await init(fixture, "claude");

  await build(fixture);

  const skillRoot = path.join(fixture.projectPath, ".claude", "skills", "skill-a");
  assert.equal(await exists(path.join(skillRoot, "SKILL.md")), true);
  assert.equal(await exists(path.join(skillRoot, "agents", "openai.yaml")), false);
  assert.equal(await exists(path.join(fixture.projectPath, ".claude", "skills", "skill-b")), false);

  const command = await fs.readFile(
    path.join(fixture.projectPath, ".claude", "commands", "aie", "skill-a.md"),
    "utf8",
  );
  assert.match(command, /description: "Description of skill-a\."/u);
  assert.match(command, /\.claude\/skills\/skill-a\/SKILL\.md/u);
  assert.match(command, /\$ARGUMENTS/u);

  const instructions = await fs.readFile(path.join(fixture.projectPath, "CLAUDE.md"), "utf8");
  assert.equal(instructions.includes("Available Skills"), false);
  assert.equal(await exists(path.join(fixture.projectPath, "AGENTS.md")), false);
});

test("Build installs persona skills for codex with the codex metadata and no commands", async () => {
  const fixture = await createInitFixture();
  await writePersona(fixture, ["skill-a", "skill-b"]);
  await init(fixture, "codex");

  await build(fixture);

  for (const skillName of ["skill-a", "skill-b"]) {
    const skillRoot = path.join(fixture.projectPath, ".agents", "skills", skillName);
    assert.equal(await exists(path.join(skillRoot, "SKILL.md")), true);
    assert.equal(await exists(path.join(skillRoot, "agents", "openai.yaml")), true);
  }

  assert.equal(await exists(path.join(fixture.projectPath, ".claude")), false);
  assert.equal(await exists(path.join(fixture.projectPath, "AGENTS.md")), true);
  assert.equal(await exists(path.join(fixture.projectPath, "CLAUDE.md")), false);
});

test("Build installs for every selected tool", async () => {
  const fixture = await createInitFixture();
  await writePersona(fixture, ["skill-a"]);
  await init(fixture, "claude,codex");

  await build(fixture);

  assert.equal(await exists(path.join(fixture.projectPath, "CLAUDE.md")), true);
  assert.equal(await exists(path.join(fixture.projectPath, "AGENTS.md")), true);
  assert.equal(await exists(path.join(fixture.projectPath, ".claude", "skills", "skill-a")), true);
  assert.equal(await exists(path.join(fixture.projectPath, ".agents", "skills", "skill-a")), true);
});

test("Build removes skills it installed earlier when the persona no longer declares them and keeps user skills", async () => {
  const fixture = await createInitFixture();
  await writePersona(fixture, ["skill-a", "skill-b"]);
  await init(fixture, "claude");
  await build(fixture);

  const userSkill = path.join(fixture.projectPath, ".claude", "skills", "mine", "SKILL.md");
  await fs.mkdir(path.dirname(userSkill), { recursive: true });
  await fs.writeFile(userSkill, "my own skill\n");

  await writePersona(fixture, ["skill-a"]);
  await build(fixture);

  assert.equal(await exists(path.join(fixture.projectPath, ".claude", "skills", "skill-a")), true);
  assert.equal(await exists(path.join(fixture.projectPath, ".claude", "skills", "skill-b")), false);
  assert.equal(await exists(path.join(fixture.projectPath, ".claude", "commands", "aie", "skill-b.md")), false);
  assert.equal(await fs.readFile(userSkill, "utf8"), "my own skill\n");
});

test("Build skips a skill that exists but was not installed by AIE OS unless --force-overwrite is passed", async () => {
  const fixture = await createInitFixture();
  await writePersona(fixture, ["skill-a"]);
  await init(fixture, "claude");

  const userSkill = path.join(fixture.projectPath, ".claude", "skills", "skill-a", "SKILL.md");
  await fs.mkdir(path.dirname(userSkill), { recursive: true });
  await fs.writeFile(userSkill, "my own skill\n");

  const { stdout } = await build(fixture);

  assert.match(stdout, /Warning: Skipped \.claude\/skills\/skill-a/u);
  assert.equal(await fs.readFile(userSkill, "utf8"), "my own skill\n");

  await build(fixture, ["--force-overwrite"]);

  assert.match(await fs.readFile(userSkill, "utf8"), /Description of skill-a\./u);
});

test("Build fails when the persona declares a skill that does not exist", async () => {
  const fixture = await createInitFixture();
  await writePersona(fixture, ["missing-skill"]);
  await init(fixture, "claude");

  await assert.rejects(build(fixture), (error) => {
    assert.equal(error.code, 1);
    assert.match(error.stderr, /Persona "software-developer" declares unknown skill "missing-skill"/u);
    return true;
  });
});

test("Init requires at least one supported tool", async () => {
  const fixture = await createInitFixture();

  await assert.rejects(
    execFileAsync(process.execPath, [
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
    ]),
    (error) => {
      assert.match(error.stderr, /Missing required option --tool\./u);
      return true;
    },
  );

  await assert.rejects(
    execFileAsync(process.execPath, [
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
      "--tool",
      "cursor",
    ]),
    (error) => {
      assert.match(error.stderr, /Unsupported tools: cursor/u);
      return true;
    },
  );
});
