const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const repoRoot = path.join(__dirname, "..");
const { aieOsVersion } = require(path.join(repoRoot, "dist", "context", "aieOsVersion.js"));

async function createPackageRoot(packageJson) {
  const rootPath = await fs.mkdtemp(path.join(os.tmpdir(), "aie-os-version-"));
  await fs.writeFile(path.join(rootPath, "package.json"), JSON.stringify(packageJson));
  return rootPath;
}

test("AIE OS version accepts only plain release tags", () => {
  assert.equal(aieOsVersion.isTag("v0.3.0"), true);
  assert.equal(aieOsVersion.isTag("v10.20.30"), true);

  for (const value of ["0.3.0", "v0.3", "v0.3.0-rc.1", "v01.2.3", " v0.3.0", "latest", 3, undefined]) {
    assert.equal(aieOsVersion.isTag(value), false, `${String(value)} should not be a tag`);
  }
});

test("AIE OS version compares tags numerically", () => {
  assert.ok(aieOsVersion.compare("v0.10.0", "v0.9.0") > 0);
  assert.ok(aieOsVersion.compare("v1.0.0", "v0.99.99") > 0);
  assert.ok(aieOsVersion.compare("v0.3.0", "v0.3.1") < 0);
  assert.equal(aieOsVersion.compare("v0.3.0", "v0.3.0"), 0);
  assert.throws(() => aieOsVersion.compare("latest", "v0.3.0"), /Expected an AIE OS release tag like v1\.2\.3, got latest\./u);
});

test("AIE OS version reads the running tag from the package root", async () => {
  const { version } = JSON.parse(await fs.readFile(path.join(repoRoot, "package.json"), "utf8"));

  assert.equal(await aieOsVersion.readRunning(repoRoot), `v${version}`);
  assert.equal(await aieOsVersion.readRunning(await createPackageRoot({ version: "1.2.3" })), "v1.2.3");
});

test("AIE OS version rejects a package version that is not X.Y.Z", async () => {
  for (const packageJson of [{ version: "1.2.3-rc.1" }, {}]) {
    const rootPath = await createPackageRoot(packageJson);

    await assert.rejects(aieOsVersion.readRunning(rootPath), (error) => {
      assert.equal(
        error.message,
        `Invalid AIE OS package version in ${path.join(rootPath, "package.json")}: expected "version" to be X.Y.Z.`,
      );
      return true;
    });
  }
});
