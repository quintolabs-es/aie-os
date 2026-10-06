const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const test = require("node:test");

const execFileAsync = promisify(execFile);
const repoRoot = path.join(__dirname, "..");

test("Package metadata exposes the installed aie-os command", async () => {
  const packageJson = JSON.parse(
    await fs.readFile(path.join(repoRoot, "package.json"), "utf8"),
  );

  assert.deepEqual(packageJson.bin, {
    "aie-os": "./dist/index.js",
  });
  assert.equal(packageJson.scripts.compile, "tsc -p tsconfig.json");
  assert.equal(packageJson.scripts.build, "pnpm install && pnpm compile");
  assert.equal(packageJson.scripts.prepare, "tsc -p tsconfig.json");
  assert.deepEqual(packageJson.files, ["dist", "content"]);
});

test("Packed install exposes the aie-os bin and builds from its bundled content", async () => {
  const rootPath = await fs.mkdtemp(path.join(os.tmpdir(), "aie-os-package-"));
  const consumerPath = path.join(rootPath, "consumer");
  const npmCachePath = path.join(rootPath, ".npm-cache");

  await fs.mkdir(consumerPath, { recursive: true });
  await fs.mkdir(npmCachePath, { recursive: true });
  await fs.writeFile(
    path.join(consumerPath, "package.json"),
    JSON.stringify(
      {
        name: "aie-os-package-consumer",
        private: true,
        version: "1.0.0",
      },
      null,
      2,
    ),
  );

  await execFileAsync("npm", ["pack", "--pack-destination", rootPath], {
    cwd: repoRoot,
    env: {
      ...process.env,
      npm_config_cache: npmCachePath,
    },
    maxBuffer: 10 * 1024 * 1024,
  });

  const tarballs = (await fs.readdir(rootPath)).filter((entry) => entry.endsWith(".tgz"));
  assert.equal(tarballs.length, 1);

  await execFileAsync("npm", ["install", "--save-dev", path.join(rootPath, tarballs[0])], {
    cwd: consumerPath,
    env: {
      ...process.env,
      npm_config_cache: npmCachePath,
    },
    maxBuffer: 10 * 1024 * 1024,
  });

  const installedBin = path.join(consumerPath, "node_modules", ".bin", "aie-os");

  const { stdout, stderr } = await execFileAsync(
    installedBin,
    ["--help"],
    {
      cwd: consumerPath,
      maxBuffer: 10 * 1024 * 1024,
    },
  );

  assert.equal(stderr, "");
  assert.match(stdout, /^AIE OS\r?\n/u);
  assert.match(stdout, /aie-os#<version> build \[options\]/u);

  await execFileAsync(
    installedBin,
    ["init", "--agent-persona", "software-developer", "--tool", "claude"],
    { cwd: consumerPath },
  );
  await execFileAsync(installedBin, ["build"], { cwd: consumerPath });

  const manifest = JSON.parse(
    await fs.readFile(path.join(consumerPath, ".aie-os", "aie-os.json"), "utf8"),
  );
  assert.equal(manifest.paths.agent, "bundled");
  await fs.access(
    path.join(consumerPath, ".claude", "skills", "sdd-product-discovery-skill", "SKILL.md"),
  );
  await fs.access(path.join(consumerPath, "CLAUDE.md"));
});
