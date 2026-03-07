# Engineering Principles

## Purpose

Stable cross-project reasoning rules that guide implementation decisions.

## Rules

- Prefer simple, direct solutions over additional abstraction.
- Add abstractions only after repeated pressure from multiple concrete use
  cases.
- Keep dependencies minimal and justify each new external dependency.
- Preserve existing behavior unless the change explicitly includes a migration
  plan.
- Fail clearly and early; error handling must surface actionable context.
- Design for observability when behavior is non-trivial or failure would be
  costly.

## Preferred Patterns

- Small, composable units with explicit inputs and outputs.
- Backward-compatible rollouts for interface changes.
- Structured logging and metrics at system boundaries.

## Forbidden Patterns

- Speculative generality without a proven need.
- Hidden side effects across module boundaries.
- Swallowing exceptions or returning ambiguous empty results without context.
