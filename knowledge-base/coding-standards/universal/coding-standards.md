# Coding Standards

## Purpose

Concrete coding rules that apply across stacks unless a more specific standard
narrows them.

## Rules

- Keep modules focused and name them after their responsibility.
- Organize code by vertical feature when it improves cohesion, change locality,
  and maintainability.
- Keep the artifacts needed to implement one feature close together.
- Prefer explicit dependencies over hidden global state.
- Prefer self-explanatory code over comments. Use comments only when intent
  cannot be made clear through naming and structure.
- Make side effects visible at the edges of the system.
- Keep public interfaces small and stable.
- Use structured error values or exceptions consistently within a module.
- README files must explain setup, run, and deployment with direct commands.
- Tool READMEs must explain usage directly and prefer command examples.

## Preferred Patterns

- Constructor or parameter injection for infrastructure dependencies.
- Small adapters around external services.
- Pure functions for domain logic where feasible.

## Forbidden Patterns

- Static service locators.
- Broad technical-layer separation that scatters one feature across too many
  unrelated folders.
- Utility modules that accumulate unrelated behavior.
- Implicit coupling through environment access deep inside domain code.
