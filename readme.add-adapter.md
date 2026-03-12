### Add an adapter

An adapter transforms the canonical effective context into the files a specific agent tool expects.

Adapter responsibilities:
- read `effective-context.json` through the typed `effectiveContext` object
- render agent-specific output files
- return only tool-specific artifacts as a file model

An adapter must not:
- discover source files
- decide which content is included
- re-run build logic
- parse `effective-context.md`
- write files directly

### Minimal steps

1. Create a new adapter file under:
   - `cli/src/core/agentAdapters/<tool>Adapter.ts`
2. Export an adapter object:
   - `tool`
   - `build(input) => { files, primaryArtifact }`
3. Register it in:
   - `cli/src/core/agentAdapters/index.ts`
4. Extend the supported tool type in:
   - `cli/src/core/agentAdapters/types.ts`
   - CLI parsing/help if the tool should be selectable from `build --tool`

### Adapter input

- `effectiveContext`
  - canonical machine-readable build result
- `projectPath`
  - target project root

### Adapter output

- `files`
  - file path and contents for each generated agent artifact
- `primaryArtifact`
  - main generated file name, for example `AGENTS.md`

The CLI passes this output to the artifact writer, which is the only component that writes files to disk.

### Minimal example

```ts
import type { Adapter } from "./types";

export const exampleAdapter: Adapter = {
  tool: "example",
  async build(input) {
    const contents = [
      "# EXAMPLE",
      "",
      ...input.effectiveContext.sections.map((section) => `## ${section.heading}`),
      "",
    ].join("\n");

    return {
      files: [{ path: "EXAMPLE.md", contents }],
      primaryArtifact: "EXAMPLE.md",
    };
  },
};
```

### Registry example

```ts
import { codexAdapter } from "./codexAdapter";
import { exampleAdapter } from "./exampleAdapter";

const adapters = {
  codex: codexAdapter,
  example: exampleAdapter,
};
```

One adapter file plus one registry line is the intended extension path.
