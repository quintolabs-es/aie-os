# Agent Configuration

The `content/agent/` directory contains shared agent configuration.

```text
content/agent/
  universal/
  persona/
```

- `universal/` defines agent-wide operational rules that apply across all personas.
- `persona/` defines the agent role, behavior mode, and communication style.
- `persona/<name>.md` is rendered first in the final context.
- `critical-rules.md` inside `universal/` is aggregated into the top `Critical Rules` section.
- Every other markdown file is appended afterward under a section label derived from its folder.
