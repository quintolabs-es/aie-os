const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const test = require("node:test");
const { createInitFixture } = require("./init-test-helpers");

const execFileAsync = promisify(execFile);
const cliEntry = path.join(__dirname, "..", "dist", "index.js");

test("Init without config args requires a terminal", async () => {
  await assert.rejects(
    execFileAsync(process.execPath, [cliEntry, "init"]),
    (error) => {
      assert.equal(error.code, 1);
      assert.match(
        error.stderr,
        /Init requires a terminal when no init configuration arguments are provided\./u,
      );
      return true;
    },
  );
});

test("Init with only --project-path still uses interactive mode", async () => {
  const fixture = await createInitFixture();

  await assert.rejects(
    execFileAsync(process.execPath, [cliEntry, "init", "--project-path", fixture.projectPath]),
    (error) => {
      assert.equal(error.code, 1);
      assert.match(
        error.stderr,
        /Init requires a terminal when no init configuration arguments are provided\./u,
      );
      return true;
    },
  );
});

test("Explicit init requires all mandatory options", async () => {
  const fixture = await createInitFixture();

  await assert.rejects(
    execFileAsync(process.execPath, [
      cliEntry,
      "init",
      "--project-path",
      fixture.projectPath,
      "--agent-persona",
      "software-developer",
    ]),
    (error) => {
      assert.equal(error.code, 1);
      assert.match(error.stderr, /Missing required option --tool\./u);
      assert.doesNotMatch(error.stderr, /prompted interactively/u);
      return true;
    },
  );
});

test("Explicit init succeeds with required args and defaults the skills path to bundled", async () => {
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
    "--tool",
    "codex",
  ]);

  const manifestPath = path.join(fixture.projectPath, ".aie-os", "aie-os.json");
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));

  assert.equal(manifest.paths.skills, "bundled");
  assert.deepEqual(manifest.selection.applicationTypes, []);
  assert.deepEqual(manifest.selection.frameworks, []);
  assert.deepEqual(manifest.selection.languages, []);
  assert.equal(manifest.selection.persona, "software-developer");
});

test("Explicit init accepts an explicitly empty knowledge-base path", async () => {
  const fixture = await createInitFixture();

  await execFileAsync(process.execPath, [
    cliEntry,
    "init",
    "--project-path",
    fixture.projectPath,
    "--kb-path",
    "",
    "--agent-path",
    fixture.agentPath,
    "--agent-persona",
    "software-developer",
    "--tool",
    "codex",
  ]);

  const manifestPath = path.join(fixture.projectPath, ".aie-os", "aie-os.json");
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));

  assert.equal(manifest.paths.knowledgeBase, "");
  assert.deepEqual(manifest.selection.languages, []);
  assert.deepEqual(manifest.selection.applicationTypes, []);
  assert.deepEqual(manifest.selection.frameworks, []);
});

test("Explicit init rejects invalid provided languages", async () => {
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
      "--tool",
      "codex",
      "--languages",
      "invalid-language",
    ]),
    (error) => {
      assert.equal(error.code, 1);
      assert.match(error.stderr, /Unsupported languages: invalid-language/u);
      return true;
    },
  );
});

test("Explicit init rejects invalid optional selections", async () => {
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
      "--tool",
      "codex",
      "--languages",
      "typescript",
      "--frameworks",
      "invalid-framework",
    ]),
    (error) => {
      assert.equal(error.code, 1);
      assert.match(error.stderr, /Unsupported frameworks: invalid-framework/u);
      return true;
    },
  );
});

test("Explicit init accepts application types and frameworks from direct Markdown files", async () => {
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
    "--tool",
    "codex",
    "--application-type",
    "cli",
    "--frameworks",
    "react",
  ]);

  const manifest = JSON.parse(
    await fs.readFile(path.join(fixture.projectPath, ".aie-os", "aie-os.json"), "utf8"),
  );

  assert.deepEqual(manifest.selection.applicationTypes, ["cli"]);
  assert.deepEqual(manifest.selection.frameworks, ["react"]);
});

test("Explicit init does not discover nested application-type or framework folders", async () => {
  const fixture = await createInitFixture();

  await fs.mkdir(
    path.join(fixture.knowledgeBasePath, "coding-rules", "application-type", "nested-api"),
  );
  await fs.mkdir(
    path.join(fixture.knowledgeBasePath, "coding-rules", "framework", "nested-framework"),
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
      "codex",
      "--application-type",
      "nested-api",
      "--frameworks",
      "nested-framework",
    ]),
    (error) => {
      assert.equal(error.code, 1);
      assert.match(error.stderr, /Unsupported application types: nested-api/u);
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
      "codex",
      "--application-type",
      "cli",
      "--frameworks",
      "nested-framework",
    ]),
    (error) => {
      assert.equal(error.code, 1);
      assert.match(error.stderr, /Unsupported frameworks: nested-framework/u);
      return true;
    },
  );
});

function explicitInitArguments(fixture) {
  return [
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
    "codex",
  ];
}

function manifestPathOf(fixture) {
  return path.join(fixture.projectPath, ".aie-os", "aie-os.json");
}

async function readManifest(fixture) {
  return JSON.parse(await fs.readFile(manifestPathOf(fixture), "utf8"));
}

async function runningTag() {
  const { version } = JSON.parse(await fs.readFile(path.join(__dirname, "..", "package.json"), "utf8"));
  return `v${version}`;
}

test("Explicit init records the running AIE OS tag as aieOsVersion", async () => {
  const fixture = await createInitFixture();
  const tag = await runningTag();

  const { stdout } = await execFileAsync(process.execPath, explicitInitArguments(fixture));
  const manifest = await readManifest(fixture);

  assert.equal(manifest.aieOsVersion, tag);
  assert.deepEqual(Object.keys(manifest), ["version", "aieOsVersion", "paths", "selection"]);
  assert.match(stdout, new RegExp(`Recorded AIE OS ${tag.replace(/\./gu, "\\.")} in `, "u"));
});

test("Re-running init with the same tag prints no version notice", async () => {
  const fixture = await createInitFixture();
  await execFileAsync(process.execPath, explicitInitArguments(fixture));

  const { stdout } = await execFileAsync(process.execPath, explicitInitArguments(fixture));

  assert.doesNotMatch(stdout, /Recorded AIE OS|Upgraded AIE OS/u);
});

test("Re-running init with a newer tag upgrades aieOsVersion", async () => {
  const fixture = await createInitFixture();
  await execFileAsync(process.execPath, explicitInitArguments(fixture));
  await fs.writeFile(manifestPathOf(fixture), JSON.stringify({ ...(await readManifest(fixture)), aieOsVersion: "v0.0.1" }));
  const tag = await runningTag();

  const { stdout } = await execFileAsync(process.execPath, explicitInitArguments(fixture));

  assert.equal((await readManifest(fixture)).aieOsVersion, tag);
  assert.match(stdout, /Upgraded AIE OS in .+ from v0\.0\.1 to /u);
});

test("Init refuses an older running tag and keeps the manifest", async () => {
  const fixture = await createInitFixture();
  await execFileAsync(process.execPath, explicitInitArguments(fixture));
  await fs.writeFile(manifestPathOf(fixture), JSON.stringify({ ...(await readManifest(fixture)), aieOsVersion: "v999.0.0" }));
  const manifestText = await fs.readFile(manifestPathOf(fixture), "utf8");

  await assert.rejects(execFileAsync(process.execPath, explicitInitArguments(fixture)), (error) => {
    assert.equal(error.code, 1);
    assert.match(error.stderr, /^Refusing to init with AIE OS v\d+\.\d+\.\d+: .+ requires v999\.0\.0 \("aieOsVersion"\)\.\nRerun the same command with tag v999\.0\.0\.\n$/u);
    return true;
  });

  assert.equal(await fs.readFile(manifestPathOf(fixture), "utf8"), manifestText);
});
