# Developer guide

How to work on AIE OS itself: develop, test, build this repo's own agent context, and release. To use AIE OS in a project, see [docs/readme.getting-started.md](docs/readme.getting-started.md).

Work from the repo root.

## Develop and test

```bash
pnpm install
pnpm test
```

`pnpm test` compiles with `tsc` and runs every `tests/*.test.js`.

Without Node, run the same commands in the `node:24` image:

```bash
docker run --rm -v "$PWD":"$PWD" -w "$PWD" -e COREPACK_ENABLE_DOWNLOAD_PROMPT=0 node:24 sh -c "corepack enable && pnpm install --frozen-lockfile && pnpm test"
```

- On macOS with Colima, Docker cannot read folders under `~/Documents`, `~/Desktop`, or `~/Downloads`. Clone the repo outside them.
- On Linux, the container writes `node_modules/` and `dist/` as root.

## Build this repo's own agent context

```bash
pnpm compile
node dist/index.js build
```

This repo's manifest (`.aie-os/aie-os.json`) points at the working-copy `content/` folders, so the generated `AGENTS.md` reflects local content changes. Never edit `AGENTS.md` or `.aie-os/build/` by hand.

`build` records the `package.json` version as `aieOsVersion` in `.aie-os/aie-os.json`, even while the code is ahead of that release. If you bump the version and then abandon the release, restore both files with `git checkout -- package.json .aie-os/aie-os.json`; otherwise every later build is refused.

## Docker launcher

[`aie-os-docker.sh`](aie-os-docker.sh) lets clients run AIE OS with only Docker:

```bash
curl -fsSL https://raw.githubusercontent.com/quintolabs-es/aie-os/v<X.Y.Z>/aie-os-docker.sh | bash -s <init|build> [options]
```

- It is a client launcher, not a repo-local wrapper for developing AIE OS, so the rule against repo-local wrapper scripts does not apply to it.
- Keep it equivalent to the npx option: it runs `npx --yes github:quintolabs-es/aie-os#<version>` with the caller's arguments inside a container and adds no CLI behavior of its own.
- It must run with the Bash 3.2 that ships with macOS.
- `tests/aie-os-docker.test.js` covers it with a fake `docker`.

## Versioning

Releases are git tags `vX.Y.Z` that equal the `package.json` version. Clients pin a tag in their npx or Docker command.

- Patch: fixes, documentation, and launcher changes that keep CLI options, the manifest, and generated files compatible.
- Minor: new features or content that existing projects can adopt by changing the tag and running `build`.
- Major: breaking changes to CLI options, the `.aie-os/aie-os.json` format, or the generated file layout.
- Keep versions plain `X.Y.Z`: `init` and `build` record the running tag as `aieOsVersion` and refuse an older tag, so any newer release, patches included, moves every project that builds with it forward.
- Adding an optional manifest field that older CLIs ignore is minor. Removing or renaming a field is major.

## Release a version

```bash
npm pkg set version=<X.Y.Z>
grep -rn "v<old-X.Y.Z>" README.md aie-os-docker.sh docs/readme.getting-started.md content/skills/setup-project-agent-context-skill/SKILL.md src/commands/commandLine.ts
# replace each match with v<X.Y.Z>
pnpm compile && node dist/index.js build
pnpm test
git commit -am "Release v<X.Y.Z>"
git tag v<X.Y.Z>
git push origin main v<X.Y.Z>
curl -fsSL https://raw.githubusercontent.com/quintolabs-es/aie-os/v<X.Y.Z>/aie-os-docker.sh | grep 'aie_os_version='
```

- Every pinned version reference must equal `v<package.json version>` in the commit that gets tagged, because that commit's docs, launcher, and bundled setup skill ship with the release. `tests/release.test.js` fails when a pin differs.
- Pinned references live in `README.md`, `aie-os-docker.sh`, `docs/readme.getting-started.md`, `content/skills/setup-project-agent-context-skill/SKILL.md`, `src/commands/commandLine.ts` (help text example), and this repo's `.aie-os/aie-os.json` (`aieOsVersion`, updated by `build`).
- `git commit -am` skips new files. Commit new files before the release commit, or `git add` them.
- Without Node, edit the `version` field in `package.json` by hand, then replace the `pnpm compile && node dist/index.js build` and `pnpm test` lines with:

  ```bash
  docker run --rm -v "$PWD":"$PWD" -w "$PWD" -e COREPACK_ENABLE_DOWNLOAD_PROMPT=0 node:24 sh -c "corepack enable && pnpm install --frozen-lockfile && pnpm compile && node dist/index.js build && pnpm test"
  ```

- Tag the release commit itself. Never move or reuse a pushed tag: projects pin to it.
- If a pushed release is broken, fix it on `main` and release the next patch version.
