---
applies_to:
  languages: [typescript]
  application_types: [cli]
---
- Expose the real installed CLI through the package `bin` field.
- Prefer a short repo-local wrapper when the tool folder already provides the namespace, for example `aie-os/bin/aie-os`.
- Use `src/index.ts` as the executable TypeScript entrypoint for the real CLI.
- Put command implementations under `src/commands/`.
- Keep wrapper scripts limited to forwarding to the real CLI entrypoint.
- Prefer one real executable entrypoint even when local and installed command surfaces differ.
- Prefer a thin shell wrapper in `bin/` for cloned-repo convenience.
- Prefer command parsing and command execution implemented in TypeScript source.
- Do not put business logic in shell wrappers.
- Do not create generic catch-all files such as `utils.ts` for unrelated behavior.
