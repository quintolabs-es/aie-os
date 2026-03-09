# AIE OS

`AIE OS` standardizes reusable engineering knowledge, reusable agent
configuration, reusable skills, and deterministic context delivery for coding
agents.

## Structure

```text
aie-os/
  knowledge-base/
    engineering-principles/
      universal/
    coding-standards/
      universal/
      language/
      application-type/
      framework/
  agent/
    style/
    persona/
  skills/
    global/
  cli/
```

- `knowledge-base/` holds shared engineering principles and coding standards.
- `agent/` holds shared style and persona definitions.
- `skills/` holds shared global skills.
- `cli/` sets up a project and builds agent-specific artifacts.

## Target Project

```text
xample-app/
  aie-os/
  .aie-os/
    manifest.yaml
    project-context/
    project-coding-standards/
    project-skills/
    agent-context.md
```

- `aie-os/` is the visible local clone of this repo.
- `.aie-os/` contains project-local AIE OS configuration and generated files.

## Usage

```bash
mkdir xample-app
cd xample-app
git clone <aie-os-repo-url> aie-os
bash aie-os/cli/build-cli.sh
bash aie-os/cli/init-aie-os.sh
bash aie-os/cli/build-agent-context.sh --tool codex
```

- `init-aie-os.sh` prompts for every parameter and writes `.aie-os/manifest.yaml`.
- `build-agent-context.sh --tool codex` reads the manifest and generates `.aie-os/agent-context.md`
  and `AGENTS.md`.
