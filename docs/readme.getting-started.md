### Requirements
- Node.js 20 or later, which includes `npm` and `npx`.
- `git`, used by `npx` to fetch AIE OS from GitHub.

AIE OS runs with `npx` straight from GitHub. Nothing is cloned or installed in the target project. Always pin a release tag so `init` and `build` run the same version:

```bash
npx --yes github:quintolabs-es/aie-os#v0.1.0 <init|build> [options]
```

To upgrade, change the tag and run `build` again.

### Content
AIE OS ships with ready-to-use content (personas, principles, coding rules, and skills). Content paths default to `bundled`, which means the content inside the pinned AIE OS version.

To use your own content, either:
- fork the repo, edit [`/content`](../content), and run `npx --yes github:<owner>/<fork>#<tag> <init|build>`; or
- keep the content folders in your project and pass `--kb-path`, `--agent-path`, and `--skills-path` to `init`.

See [`docs/readme.create-content.md`](./readme.create-content.md) for the content structure and authoring rules.

### Initialize AIE OS

```bash
cd xample-app

# interactive
npx --yes github:quintolabs-es/aie-os#v0.1.0 init

# OR explicit
npx --yes github:quintolabs-es/aie-os#v0.1.0 init \
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
Build context and generate the agent artifacts for each tool selected at `init`: the instructions file (`CLAUDE.md` for `claude`, `AGENTS.md` for `codex`) and the persona skills and commands.

```bash
npx --yes github:quintolabs-es/aie-os#v0.1.0 build [--project-path <value>] [--force-overwrite]
```

* `--force-overwrite`: optional. `build` replaces its own generated files freely, but refuses to overwrite an instructions file AIE OS did not generate and skips skills or commands it did not install. Pass this flag to replace them anyway.
* `--project-path /path/to/project` optional, defaults to current directory.
