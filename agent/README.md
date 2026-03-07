# Agent Configuration

The `agent/` directory contains reusable agent-behavior inputs for `AIE OS`.

## Scope

- `10-style/` defines how the agent communicates.
- `20-persona/` defines the behavioral role the agent should follow.

## Precedence

Within agent configuration, higher-precedence behavior appears earlier:

1. `10-style`
2. `20-persona`

`persona` is the lowest-precedence reusable layer in the system.
