### Requirements
AIE OS runs straight from GitHub. Nothing is cloned or installed in the target project. Pick one way to run it:
- Run with npx (requires Node): Node.js 20 or later, which includes `npm` and `npx`, and `git`, used by `npx` to fetch AIE OS from GitHub.
- Run with Docker (requires only Docker): a running Docker on macOS, Linux, or Windows with WSL. The command also uses `curl` and `bash`, which macOS and Linux include.

Always pin a release tag. `init` records it as `aieOsVersion` in `.aie-os/aie-os.json`; use that tag for every later `init` and `build`, and commit the manifest when it changes.
- Upgrade: pick the latest tag from https://github.com/quintolabs-es/aie-os/tags, change the tag in your command, run `build`, and commit `.aie-os/aie-os.json`.
- An older tag is refused: `Refusing to build with AIE OS <tag>: .aie-os/aie-os.json requires <pinned-tag>`. To downgrade on purpose, edit `aieOsVersion` first.
- Releases from before `aieOsVersion` existed do not check it, and their `init` removes it, so do not run them on a project that records `aieOsVersion`.
- Projects set up before `aieOsVersion` existed get it on their next `build`.

To run the recorded tag in a script or CI:

```bash
tag="$(sed -n 's/.*"aieOsVersion": *"\(v[0-9.]*\)".*/\1/p' .aie-os/aie-os.json)"
# with npx
npx --yes "github:quintolabs-es/aie-os#${tag:?aieOsVersion is missing from .aie-os/aie-os.json}" build
# OR with Docker
set -o pipefail; curl -fsSL "https://raw.githubusercontent.com/quintolabs-es/aie-os/${tag:?aieOsVersion is missing from .aie-os/aie-os.json}/aie-os-docker.sh" | bash -s build
```

### Run with npx (requires Node)

```bash
npx --yes github:quintolabs-es/aie-os#v0.2.1 <init|build> [options]
```

### Run with Docker (requires only Docker)

```bash
curl -fsSL https://raw.githubusercontent.com/quintolabs-es/aie-os/v0.2.1/aie-os-docker.sh | bash -s <init|build> [options]
```

[`aie-os-docker.sh`](../aie-os-docker.sh) runs the same pinned `npx` command inside a `node:24` Docker container:
- It mounts the current directory at the same path inside the container. Run it from the target project directory and do not pass `--project-path`.
- It prompts in your terminal when one is attached. Without a terminal, for example in a coding agent or CI, use explicit `init` and `build`, and prefix the command with `set -o pipefail;` so a failed download fails the command.
- On Linux, you own the generated files, including with rootless Docker or Podman.
- It downloads and compiles AIE OS on every run, so a run takes about 20 to 60 seconds and needs access to GitHub and the npm registry. The first run also pulls the `node:24` image from Docker Hub.
- Content folders outside the target project are not visible inside the container. Use `bundled` content or folders inside the project.
- On macOS, Docker must be allowed to read the project folder. If the run fails with `Operation not permitted`, for example for a project under `~/Documents`, `~/Desktop`, or `~/Downloads`: with Docker Desktop, enable Docker in System Settings > Privacy & Security > Files and Folders; with Colima, move the project outside those folders.

### Content
AIE OS ships with ready-to-use content (personas, principles, coding rules, and skills). Content paths default to `bundled`, which means the content inside the pinned AIE OS version.

To use your own content, either:
- fork the repo, edit [`/content`](../content), and run `npx --yes github:<owner>/<fork>#<tag> <init|build>`. Keep the fork's version at or above the upstream version it is based on, because `aieOsVersion` compares version numbers only; or
- keep the content folders in your project and pass `--kb-path`, `--agent-path`, and `--skills-path` to `init`.

See [`docs/readme.create-content.md`](./readme.create-content.md) for the content structure and authoring rules.

### Initialize AIE OS

```bash
cd xample-app

# interactive
npx --yes github:quintolabs-es/aie-os#v0.2.1 init

# OR interactive with Docker
curl -fsSL https://raw.githubusercontent.com/quintolabs-es/aie-os/v0.2.1/aie-os-docker.sh | bash -s init

# OR explicit
npx --yes github:quintolabs-es/aie-os#v0.2.1 init \
  --agent-persona <value> \
  --tool <claude,codex> \
  [--languages <value1,value2>] \
  [--application-type <value1,value2>] \
  [--frameworks <value1,value2>] \
  [--kb-path <value>] \
  [--agent-path <value>] \
  [--skills-path <value>]

# OR explicit with Docker
curl -fsSL https://raw.githubusercontent.com/quintolabs-es/aie-os/v0.2.1/aie-os-docker.sh | bash -s init \
  --agent-persona <value> \
  --tool <claude,codex> \
  [--languages <value1,value2>] \
  [--application-type <value1,value2>] \
  [--frameworks <value1,value2>] \
  [--kb-path <value>] \
  [--agent-path <value>] \
  [--skills-path <value>]
```

#### `init` command options:
* `--project-path /path/to/app/project/dir`: optional, defaults to current directory;
* `--agent-persona <name>`: required in explicit mode; prompted in interactive mode. Available values come from markdown file names under `[agent-path]/persona/`;
* `--tool <name1,name2>`: required in explicit mode; prompted in interactive mode. Accepted values: `claude`, `codex`;
* `--languages <name1,name2>`: optional. Available values come from folder names under `[kb-path]/coding-rules/language/`;
* `--application-type <name1,name2>`: optional. Available values come from file names under `[kb-path]/coding-rules/application-type/`;
* `--frameworks <name1,name2>`: optional. Available values come from file names under `[kb-path]/coding-rules/framework/`;
* `--kb-path /path/to/knowledge-base/dir`: optional, defaults to `bundled`. Empty disables the knowledge base;
* `--agent-path /path/to/agent/dir`: optional, defaults to `bundled`;
* `--skills-path /path/to/skills/dir`: optional, defaults to `bundled`. Empty disables skills. Persona skills are resolved from this folder.

`init` modes:
- no init config arguments: interactive mode
- any init config argument (`--kb-path`, `--agent-path`, `--skills-path`, `--agent-persona`, `--tool`, `--languages`, `--application-type`, `--frameworks`): explicit mode
- `--project-path` alone does not switch `init` to explicit mode
- in explicit mode, omitted content paths default to `bundled`, other omitted optional values become empty, and `init` does not prompt

### Build agent context
Build context and generate the agent artifacts for each tool selected at `init`: the instructions file (`CLAUDE.md` for `claude`, `AGENTS.md` for `codex`), the rule files in `.claude/rules/aie/` for `claude`, and the persona skills and commands.

```bash
npx --yes github:quintolabs-es/aie-os#v0.2.1 build [--project-path <value>] [--force-overwrite]

# OR with Docker
curl -fsSL https://raw.githubusercontent.com/quintolabs-es/aie-os/v0.2.1/aie-os-docker.sh | bash -s build [--force-overwrite]
```

* `--force-overwrite`: optional. `build` replaces its own generated files freely, but refuses to overwrite an instructions file or rule file AIE OS did not generate and skips skills or commands it did not install. Pass this flag to replace them anyway.
* `--project-path /path/to/project` optional, defaults to current directory.
