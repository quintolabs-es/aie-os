const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const distPath = path.join(__dirname, "..", "dist", "context");
const { manifestAieOsVersion } = require(path.join(distPath, "manifestAieOsVersion.js"));
const { loadManifest } = require(path.join(distPath, "manifest.js"));

const legacyManifest = {
  version: "0.1",
  paths: { agent: "bundled", skills: "bundled", knowledgeBase: "bundled", projectCodingRules: ".aie-os/project-coding-rules" },
  selection: { applicationTypes: [], frameworks: [], languages: [], persona: "software-developer", tools: ["claude"] },
};

async function writeManifest(contents) {
  const rootPath = await fs.mkdtemp(path.join(os.tmpdir(), "aie-os-manifest-"));
  const manifestPath = path.join(rootPath, "aie-os.json");
  await fs.writeFile(manifestPath, typeof contents === "string" ? contents : JSON.stringify(contents, null, 2));
  return manifestPath;
}

test("Manifest without aieOsVersion still loads", async () => {
  const manifest = await loadManifest(await writeManifest(legacyManifest));

  assert.equal(manifest.aieOsVersion, undefined);
  assert.equal("aieOsVersion" in manifest, false);
});

test("Manifest rejects an aieOsVersion that is not a release tag", async () => {
  for (const aieOsVersion of ["latest", "0.3.0"]) {
    const manifestPath = await writeManifest({ ...legacyManifest, aieOsVersion });
    const expected = `Expected aieOsVersion to be a release tag like v1.2.3 in manifest: ${manifestPath}`;

    await assert.rejects(loadManifest(manifestPath), { message: expected });
    await assert.rejects(manifestAieOsVersion.read(manifestPath), { message: expected });
  }
});

test("Reading aieOsVersion returns undefined when there is no usable manifest or field", async () => {
  const missingPath = path.join(await fs.mkdtemp(path.join(os.tmpdir(), "aie-os-manifest-")), "aie-os.json");

  assert.equal(await manifestAieOsVersion.read(missingPath), undefined);
  assert.equal(await manifestAieOsVersion.read(await writeManifest("{ not json")), undefined);
  assert.equal(await manifestAieOsVersion.read(await writeManifest("[]")), undefined);
  assert.equal(await manifestAieOsVersion.read(await writeManifest(legacyManifest)), undefined);
  assert.equal(await manifestAieOsVersion.read(await writeManifest({ ...legacyManifest, aieOsVersion: "v0.3.0" })), "v0.3.0");
});

test("Saving aieOsVersion inserts it after version and keeps every other key in order", async () => {
  const manifestPath = await writeManifest({ ...legacyManifest, custom: { kept: true } });

  await manifestAieOsVersion.save(manifestPath, "v0.3.0");
  const saved = JSON.parse(await fs.readFile(manifestPath, "utf8"));

  assert.deepEqual(Object.keys(saved), ["version", "aieOsVersion", "paths", "selection", "custom"]);
  assert.equal(saved.aieOsVersion, "v0.3.0");
  assert.deepEqual(saved.custom, { kept: true });
});

test("Saving aieOsVersion replaces an existing tag in place", async () => {
  const manifestPath = await writeManifest({ ...legacyManifest, aieOsVersion: "v0.2.1" });

  await manifestAieOsVersion.save(manifestPath, "v0.3.0");
  const saved = JSON.parse(await fs.readFile(manifestPath, "utf8"));

  assert.deepEqual(Object.keys(saved), ["version", "paths", "selection", "aieOsVersion"]);
  assert.equal(saved.aieOsVersion, "v0.3.0");
});
