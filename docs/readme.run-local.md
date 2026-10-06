### Develop AIE OS

Work from the repo root. Users run AIE OS with `npx` (see [readme.getting-started.md](./readme.getting-started.md)); the commands below are only for changing and testing AIE OS itself.

```bash
pnpm install
pnpm test
```

### Build this repo's own agent context

This repo's manifest (`.aie-os/aie-os.json`) points at the working-copy `content/` folders, so the generated context reflects local content changes.

```bash
pnpm compile
node dist/index.js build
```

### Release a version

```bash
# 1. bump "version" in package.json, for example 0.2.0, and commit
# 2. tag that commit and push the tag
git tag v0.2.0
git push origin v0.2.0
```

Then update the pinned tag in the docs and in `content/skills/setup-project-agent-context-skill/SKILL.md`.
