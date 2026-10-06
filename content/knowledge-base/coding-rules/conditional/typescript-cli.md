---
applies_to:
  languages: [typescript]
  application_types: [cli]
---
- Expose the real installed CLI through the package `bin` field.
- Run the CLI through the package `bin`, for example with `npx`. Do not add repo-local wrapper scripts.
- Use `src/index.ts` as the executable TypeScript entrypoint for the real CLI.
- Put command implementations under `src/commands/`.
- Prefer one real executable entrypoint even when local and installed command surfaces differ.
- Prefer command parsing and command execution implemented in TypeScript source.
- Do not create generic catch-all files such as `utils.ts` for unrelated behavior.
