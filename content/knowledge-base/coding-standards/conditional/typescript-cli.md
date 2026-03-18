---
applies_to:
  languages: [typescript]
  application_types: [cli]
---
- Expose the real installed CLI through the package `bin` field.
- Keep the local clone workflow aligned with the installed CLI contract by using a thin `bin/<app-name>` wrapper.
- Use `src/index.ts` as the executable TypeScript entrypoint for the real CLI.
- Put command implementations under `src/commands/`.
- Keep wrapper scripts limited to forwarding to the real CLI entrypoint.
- Prefer one real command surface for both local and installed usage.
- Prefer a thin shell wrapper in `bin/<app-name>` for cloned-repo convenience.
- Prefer command parsing and command execution implemented in TypeScript source.
- Do not put business logic in shell wrappers.
- Do not use divergent command names for local usage versus installed usage.
- Do not create generic catch-all files such as `utils.ts` for unrelated behavior.
