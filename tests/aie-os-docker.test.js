const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { execFile, execFileSync, spawn } = require("node:child_process");
const { promisify } = require("node:util");
const test = require("node:test");

const execFileAsync = promisify(execFile);
const repoRoot = path.join(__dirname, "..");
const launcherPath = path.join(repoRoot, "aie-os-docker.sh");
const bashPath = findExecutable("bash");
const scriptCommandPath = findExecutable("script");

const fakeDocker = `#!/bin/sh
if [ "$1" = "info" ] && [ "$2" = "--format" ]; then
  case "$3" in
    *SecurityOptions*) echo "$FAKE_DOCKER_SECURITY_OPTIONS" ;;
  esac
  exit 0
fi
if [ "$1" = "info" ]; then
  if [ -n "$FAKE_DOCKER_INFO_ERROR" ]; then
    echo "$FAKE_DOCKER_INFO_ERROR" >&2
    exit 1
  fi
  exit 0
fi
printf '%s\\n' "$@" > "$FAKE_DOCKER_ARGS_FILE"
if [ -t 0 ]; then echo stdin-tty >> "$FAKE_DOCKER_ARGS_FILE"; fi
exit "\${FAKE_DOCKER_RUN_EXIT_CODE:-0}"
`;
const fakeUname = `#!/bin/sh
echo "$FAKE_UNAME"
`;
const fakeId = `#!/bin/sh
case "$1" in
  -u) echo 1001 ;;
  -g) echo 1002 ;;
esac
`;

async function createLauncherFixture() {
  const rootPath = await fs.mkdtemp(path.join(os.tmpdir(), "aie-os-docker-"));
  const binPath = path.join(rootPath, "bin");
  const emptyBinPath = path.join(rootPath, "empty-bin");
  const projectPath = path.join(rootPath, "project");

  await fs.mkdir(binPath);
  await fs.mkdir(emptyBinPath);
  await fs.mkdir(projectPath);

  for (const [name, contents] of Object.entries({ docker: fakeDocker, id: fakeId, uname: fakeUname })) {
    await fs.writeFile(path.join(binPath, name), contents, { mode: 0o755 });
  }

  return {
    argsFile: path.join(rootPath, "docker-args.txt"),
    binPath,
    emptyBinPath,
    projectPath: await fs.realpath(projectPath),
  };
}

function findExecutable(name) {
  try {
    return execFileSync("bash", ["-c", `command -v ${name}`], { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

function launcherEnv(fixture, env) {
  return {
    ...process.env,
    FAKE_DOCKER_ARGS_FILE: fixture.argsFile,
    FAKE_UNAME: "Darwin",
    PATH: `${fixture.binPath}${path.delimiter}${process.env.PATH}`,
    ...env,
  };
}

function runLauncher(fixture, args, env = {}, cwd = fixture.projectPath) {
  return execFileAsync(bashPath, [launcherPath, ...args], { cwd, env: launcherEnv(fixture, env) });
}

function runPipedLauncherInTerminal(fixture, command) {
  const pipedLauncher = `"${bashPath}" -s ${command} < "${launcherPath}"`;
  const scriptArgs =
    process.platform === "darwin"
      ? ["-q", "/dev/null", bashPath, "-c", pipedLauncher]
      : ["-qec", pipedLauncher, "/dev/null"];

  return new Promise((resolve, reject) => {
    const child = spawn(scriptCommandPath, scriptArgs, {
      cwd: fixture.projectPath,
      env: launcherEnv(fixture, {}),
      stdio: "ignore",
    });

    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`script exited with ${code}`))));
  });
}

async function readDockerArgs(fixture) {
  return (await fs.readFile(fixture.argsFile, "utf8")).split("\n").filter((line) => line !== "");
}

async function expectedNpxSpec() {
  const { version } = JSON.parse(await fs.readFile(path.join(repoRoot, "package.json"), "utf8"));
  return `github:quintolabs-es/aie-os#v${version}`;
}

test("Docker launcher runs the pinned npx command in node:24 with the project mounted at its own path", async () => {
  const fixture = await createLauncherFixture();

  await runLauncher(fixture, ["build", "--force-overwrite"]);

  assert.deepEqual(await readDockerArgs(fixture), [
    "run",
    "--rm",
    "--init",
    "--mount",
    `type=bind,source=${fixture.projectPath},target=${fixture.projectPath}`,
    "--workdir",
    fixture.projectPath,
    "--security-opt",
    "label=disable",
    "--env",
    "NO_COLOR",
    "node:24",
    "npx",
    "--yes",
    await expectedNpxSpec(),
    "build",
    "--force-overwrite",
  ]);
});

test("Docker launcher on Linux runs as the invoking user with a writable home", async () => {
  const fixture = await createLauncherFixture();

  await runLauncher(fixture, ["init", "--tool", "claude"], { FAKE_UNAME: "Linux" });

  assert.deepEqual(await readDockerArgs(fixture), [
    "run",
    "--rm",
    "--init",
    "--mount",
    `type=bind,source=${fixture.projectPath},target=${fixture.projectPath}`,
    "--workdir",
    fixture.projectPath,
    "--security-opt",
    "label=disable",
    "--env",
    "NO_COLOR",
    "--user",
    "1001:1002",
    "--env",
    "HOME=/tmp",
    "node:24",
    "npx",
    "--yes",
    await expectedNpxSpec(),
    "init",
    "--tool",
    "claude",
  ]);
});

test("Docker launcher exits with the CLI exit code", async () => {
  const fixture = await createLauncherFixture();

  await assert.rejects(runLauncher(fixture, ["build"], { FAKE_DOCKER_RUN_EXIT_CODE: "3" }), (error) => {
    assert.equal(error.code, 3);
    return true;
  });
});

test("Docker launcher on a rootless Linux engine runs as container root, which maps to the invoking user", async () => {
  const fixture = await createLauncherFixture();

  await runLauncher(fixture, ["build"], {
    FAKE_DOCKER_SECURITY_OPTIONS: "[name=seccomp,profile=builtin name=rootless name=cgroupns]",
    FAKE_UNAME: "Linux",
  });

  const dockerArgs = await readDockerArgs(fixture);
  assert.equal(dockerArgs.includes("--user"), false);
  assert.equal(dockerArgs.includes("HOME=/tmp"), false);
});

test(
  "Docker launcher piped into bash attaches the terminal so init can prompt",
  { skip: scriptCommandPath ? false : "the script command is not available", timeout: 10000 },
  async () => {
    const fixture = await createLauncherFixture();

    await runPipedLauncherInTerminal(fixture, "init");

    assert.deepEqual((await readDockerArgs(fixture)).slice(-8), [
      "--interactive",
      "--tty",
      "node:24",
      "npx",
      "--yes",
      await expectedNpxSpec(),
      "init",
      "stdin-tty",
    ]);
  },
);

test("Docker launcher fails with a clear message when Docker is not installed", async () => {
  const fixture = await createLauncherFixture();

  await assert.rejects(runLauncher(fixture, ["build"], { PATH: fixture.emptyBinPath }), (error) => {
    assert.equal(error.code, 1);
    assert.match(error.stderr, /aie-os-docker: Docker is required\./u);
    return true;
  });
});

test("Docker launcher shows the Docker error when Docker is not running or not accessible", async () => {
  const fixture = await createLauncherFixture();

  await assert.rejects(
    runLauncher(fixture, ["build"], { FAKE_DOCKER_INFO_ERROR: "permission denied while trying to connect to the docker API" }),
    (error) => {
      assert.equal(error.code, 1);
      assert.match(error.stderr, /permission denied while trying to connect to the docker API/u);
      assert.match(error.stderr, /aie-os-docker: Docker is not running or not accessible\./u);
      return true;
    },
  );
  await assert.rejects(fs.access(fixture.argsFile));
});

test("Docker launcher refuses a project path that Docker cannot mount", async () => {
  const fixture = await createLauncherFixture();
  const commaPath = path.join(fixture.projectPath, "a,b");
  await fs.mkdir(commaPath);

  await assert.rejects(runLauncher(fixture, ["build"], {}, commaPath), (error) => {
    assert.equal(error.code, 1);
    assert.match(error.stderr, /aie-os-docker: The project path cannot contain ','/u);
    return true;
  });
  await assert.rejects(fs.access(fixture.argsFile));
});
