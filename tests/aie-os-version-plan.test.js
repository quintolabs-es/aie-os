const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const { planAieOsVersion } = require(path.join(__dirname, "..", "dist", "commands", "planAieOsVersion.js"));

const manifestFile = path.join(".aie-os", "aie-os.json");

test("Version plan keeps a project pinned to the running tag", () => {
  assert.deepEqual(planAieOsVersion({ command: "build", pinnedTag: "v0.3.0", runningTag: "v0.3.0" }), { kind: "keep" });
});

test("Version plan records the running tag in a project without one", () => {
  assert.deepEqual(planAieOsVersion({ command: "build", pinnedTag: undefined, runningTag: "v0.3.0" }), {
    kind: "record",
    notice: `Recorded AIE OS v0.3.0 in ${manifestFile} ("aieOsVersion"). Run init and build for this project with tag v0.3.0, and commit ${manifestFile}.`,
    tag: "v0.3.0",
  });
});

test("Version plan upgrades a project to a newer running tag", () => {
  assert.deepEqual(planAieOsVersion({ command: "init", pinnedTag: "v0.9.0", runningTag: "v0.10.0" }), {
    kind: "record",
    notice: `Upgraded AIE OS in ${manifestFile} ("aieOsVersion") from v0.9.0 to v0.10.0. Run init and build for this project with tag v0.10.0, and commit ${manifestFile}.`,
    tag: "v0.10.0",
  });
});

test("Version plan refuses an older running tag, including an older patch", () => {
  for (const [command, pinnedTag, runningTag] of [
    ["build", "v0.3.1", "v0.3.0"],
    ["init", "v0.10.0", "v0.9.0"],
  ]) {
    assert.deepEqual(planAieOsVersion({ command, pinnedTag, runningTag }), {
      kind: "refuse",
      message: [
        `Refusing to ${command} with AIE OS ${runningTag}: ${manifestFile} requires ${pinnedTag} ("aieOsVersion").`,
        `Rerun the same command with tag ${pinnedTag}.`,
      ].join("\n"),
    });
  }
});
