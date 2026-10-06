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

Every pinned version reference must equal `v<package.json version>` in the commit that gets tagged, because that commit's docs and bundled setup skill ship with the release. `pnpm test` fails when a pin differs (`tests/release.test.js`).

Pinned references live in:
- `README.md`
- `docs/readme.getting-started.md`
- `content/skills/setup-project-agent-context-skill/SKILL.md`
- `src/commands/commandLine.ts` (help text example)

```bash
npm pkg set version=<X.Y.Z>
grep -rn "v<old-X.Y.Z>" README.md docs/readme.getting-started.md content/skills/setup-project-agent-context-skill/SKILL.md src/commands/commandLine.ts
# replace each match with v<X.Y.Z>
pnpm test
git commit -am "Release v<X.Y.Z>"
git tag v<X.Y.Z>
git push origin main v<X.Y.Z>
```

Never move or reuse a pushed tag. Projects pin to it.
