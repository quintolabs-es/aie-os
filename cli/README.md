# AIE OS CLI

`cli/` sets up a target project and builds agent-specific artifacts from the
manifest stored in `.aie-os/`.

## Setup

```bash
cd aie-os/cli
npm install
npm run build
```

Or from the target project root:

```bash
./aie-os/cli/setup.sh
```

## Usage

```bash
mkdir my-new-app
cd my-new-app
git clone <aie-os-repo-url> aie-os
bash aie-os/cli/setup.sh
bash aie-os/cli/init.sh
bash aie-os/cli/build.sh --tool codex
```

## Commands

```bash
bash aie-os/cli/init.sh
bash aie-os/cli/build.sh --tool codex
```

- `init.sh` prompts for every parameter and writes `.aie-os/manifest.yaml`.
- `build.sh --tool codex` reads `.aie-os/manifest.yaml`.

## Generated Files

- `repo/.aie-os/agent-context.md`
- `repo/AGENTS.md`
