const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const test = require("node:test");

const repoRoot = path.join(__dirname, "..");
const pinnedFiles = [
  ".aie-os/aie-os.json",
  "README.md",
  "aie-os-docker.sh",
  "docs/readme.getting-started.md",
  "content/skills/setup-project-agent-context-skill/SKILL.md",
  "src/commands/commandLine.ts",
];

test("Every pinned release tag matches the package.json version", async () => {
  const { version } = JSON.parse(await fs.readFile(path.join(repoRoot, "package.json"), "utf8"));
  const expectedTag = `v${version}`;

  for (const relativePath of pinnedFiles) {
    const contents = await fs.readFile(path.join(repoRoot, relativePath), "utf8");
    const pins = contents.match(/\bv\d+\.\d+\.\d+\b/gu) ?? [];

    assert.notEqual(pins.length, 0, `${relativePath} has no pinned release tag`);
    assert.deepEqual(
      pins.filter((pin) => pin !== expectedTag),
      [],
      `${relativePath} pins a tag other than ${expectedTag}`,
    );
  }
});
