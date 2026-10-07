# AIE OS

**Make every coding agent, in every project, follow the same engineering and coding rules.**

- Define coding **principles**, **rules**, and **skills** in a simple, maintainable structure.
- Maintain those rules centrally and **reuse them** across multiple projects and agents.
- Add **project-specific** rules **only** where local variation is needed.
- Build deterministic **agent context** from the same shared rules and skills.

## Problem
I want all the coding agents I use across all my projects/repositories, create code according to a common set of engineering principles and coding rules I set.
I want to build this knowledge base of rules and be able to use them to create a "context" so I can feed it to all my agents across all my projects.

## How AIE-OS works in a nutshell
AIE OS runs straight from GitHub, pinned to a release tag. Nothing is cloned or installed in the target project. Run it in one of two ways:
- Run with npx (requires Node): `npx --yes github:quintolabs-es/aie-os#v0.2.1 <init|build>`
- Run with Docker (requires only Docker): `curl -fsSL https://raw.githubusercontent.com/quintolabs-es/aie-os/v0.2.1/aie-os-docker.sh | bash -s <init|build>`. [`aie-os-docker.sh`](aie-os-docker.sh) runs the same `npx` command inside a `node:24` Docker container.

On `init`, it captures the project configuration (content paths, persona, tools, project language, application type, etc). Content paths default to `bundled`: the content shipped with the pinned AIE OS version.
On `build` it aggregates all the relevant rules from the specified locations and builds the final tool-specific context artifacts.
Each persona declares the skills it needs in its frontmatter. `build` installs those skills, and a slash command per skill where the tool supports commands, in the folders each tool expects (see Agent Adapters). Skills are expected to follow the Agent Skills packaging specification at https://agentskills.io/specification.

## Create content
The content structure is intentionally simple: add clear, direct, reusable files under the appropriate folders so `init` can discover options from folder names and `build` can resolve them deterministically.

Check [docs/readme.create-content.md](docs/readme.create-content.md) for instructions to create content.

## Getting started
Check [docs/readme.getting-started.md](docs/readme.getting-started.md) for installation and target-project usage.

**Coding agent instructions:** if you are a coding agent asked to set up, build, or create AIE OS context for a project, use the [`setup-project-agent-context-skill`](content/skills/setup-project-agent-context-skill/SKILL.md) skill to gather configuration and run the CLI, instead of improvising commands.

## Develop and release
Check [DEVELOPER.md](DEVELOPER.md) for working on AIE OS itself, versioning, and the release steps.

## Target project structure
AIE OS runs from GitHub with `npx` or Docker, so the target project holds only its AIE OS configuration and generated artifacts.

Below is the typical target project structure after `init` and `build`.
```text
xample-app/
  .aie-os/
    aie-os.json
    project-coding-rules/
    build/
      effective-context.json
      installed-artifacts.json
  CLAUDE.md                 # tool: claude
  AGENTS.md                 # tool: codex
  .claude/rules/aie/        # tool: claude
  .claude/skills/           # tool: claude
  .claude/commands/aie/     # tool: claude
  .agents/skills/           # tool: codex
```

- `.aie-os/` contains project-local AIE OS configuration and generated artifacts. keep it versioned in the project repo.
- The instructions file is generated at the target project root: `CLAUDE.md` for `claude`, `AGENTS.md` for `codex`.
- For `claude`, `CLAUDE.md` holds the persona and critical rules; every other section is written to its own rule file in `.claude/rules/aie/`, which Claude Code loads automatically. For `codex`, `AGENTS.md` holds everything.

## Building Context

- `build` resolves shared knowledge, agent configuration, shared coding rules, and project coding rules into one canonical output, then installs the persona skills for each selected tool.
- Engineering principles always load; architecture principles load with a technical selection or a persona `includes: [architecture-principles]`. Coding rules are included only when the project selects at least one language, application type, or framework. With no technical selection, the context is the persona, agent rules, principles, project coding rules, and skills.
- Rendering order:
  - selected persona
  - all matched `critical-rules.md`
  - all other matched markdown files
- Final section labels come from the folder structure, not from headings inside the content files.
- Persona skills are listed separately in the canonical context so adapters can install them without inlining each skill body.
- Canonical outputs:
  - `.aie-os/build/effective-context.json`
  - `.aie-os/build/installed-artifacts.json` (paths installed by AIE OS, used for cleanup)
- `effective-context.json` is the machine-readable canonical build artifact and adapter contract.
- Every `source` in `effective-context.json` is a portable reference: a project-relative path for files inside the project, `bundled:<path>` for content shipped with AIE OS, or an absolute path otherwise. Resolve it with `contentPath.fromReference`; do not treat it as a filesystem path.
- `effective-context.json` includes `metadata.inputs` as provenance about which persona, languages, application types, and frameworks were used to build the context.
- Adapters write tool-specific artifacts only.
- After `build`, AIE OS prints the adapter-specific bootstrap prompt to use when starting a new agent session.

## Agent Adapters
- Adapters transform the canonical effective context into the agent-specific files each tool expects.
- `init --tool <claude,codex>` selects the tools. The selection is stored in `.aie-os/aie-os.json` and `build` reads it.
- A persona declares its skills in frontmatter: `skills: [<skill-folder>, ...]`. Names are folders under the skills path.
- Installed locations:

| Tool | Instructions file | Rule files | Skills | Commands |
|---|---|---|---|---|
| `claude` | `CLAUDE.md` (persona, critical rules) | `.claude/rules/aie/<section>.md`, one per section | `.claude/skills/<skill>/` | `.claude/commands/aie/<skill>.md` (`/aie:<skill>`) |
| `codex` | `AGENTS.md` (everything) | none | `.agents/skills/<skill>/` | none (skills only) |

- Skill folders are copied as they are. `agents/openai.yaml` is copied for `codex` only.
- Rule file names come from the section label, for example `Language: typescript` becomes `language-typescript.md`. Two labels that map to the same file name fail the build.
- `build` records what it installs in `.aie-os/build/installed-artifacts.json` and removes installed skills, commands, and rule files that are no longer generated. Files it did not install are never removed.
- `build` replaces its own generated files on every run. It refuses to overwrite an instructions file or rule file it did not generate, and skips a skill or command that exists but was not installed by AIE OS. Pass `--force-overwrite` to replace them.
