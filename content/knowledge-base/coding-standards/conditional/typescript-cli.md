---
applies_to:
  languages: [typescript]
  application_types: [cli]
---
# TypeScript CLI Standards

## Purpose

Rules for TypeScript CLI applications that are consumed through a `bin/<app-name>` command surface.

## Rules

- Expose the real installed CLI through the package `bin` field.
- Keep the local clone workflow aligned with the installed CLI contract by using a thin `bin/<app-name>` wrapper.
- Use `src/index.ts` as the executable TypeScript entrypoint for the real CLI.
- Put command implementations under `src/commands/`.
- Keep wrapper scripts limited to forwarding to the real CLI entrypoint.

## Preferred Patterns

- One real command surface for both local and installed usage.
- A thin shell wrapper in `bin/<app-name>` for cloned-repo convenience.
- Command parsing and command execution implemented in TypeScript source.

## Forbidden Patterns

- Business logic in shell wrappers.
- Divergent command names for local usage versus installed usage.
- Generic catch-all files such as `utils.ts` for unrelated behavior.
