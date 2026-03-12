# TypeScript Standards

## Purpose

Language-specific standards for TypeScript codebases.

## Rules

- Use strict compiler settings and keep type errors at zero.
- Code changes must pass TypeScript compilation or the strongest configured
  static type check before they are considered complete.
- Use one primary exported object per file. The file name must match the
  primary exported object name.
- Prefer explicit domain types over loose object literals.
- Validate untrusted runtime input at the boundary before narrowing types.
- Keep asynchronous flows explicit and handle rejected promises.
- Supporting `interface` and `type` contract objects may stay in the same file
  when they are tightly scoped to that primary export.
- If an interface or type contract is used by only one implementation and is
  not reused, it may stay in the same file as that implementation.
- If a contract is defined in its own file, keep its request and response types
  in that same file.

## Preferred Patterns

- Discriminated unions for state and result modeling.
- Named exports for reusable modules.
- `readonly` data where mutation is not required.

## Forbidden Patterns

- `any` in production code without a documented boundary reason.
- Type assertions used to bypass missing validation.
- Shared mutable module state for request-scoped behavior.
