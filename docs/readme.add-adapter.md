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
- write files directly

### Architecture

The extension model is:

1. one adapter folder under:
   - `src/agentAdapters/<tool>/`
2. the adapter implementation file inside that folder:
   - `src/agentAdapters/<tool>/<tool>Adapter.ts`
3. optional adapter-local helpers in the same folder
4. one static registry entry in:
   - `src/agentAdapters/index.ts`
5. one supported tool type update in:
   - `src/agentAdapters/types.ts`
6. adapter selection in:
   - `src/commands/build.ts`

### When a new adapter is justified

The output file name is not a reason to add an adapter. `build --output-file <name>` already names the generated file, so a tool that only wants a different file name needs no code at all.

Add an adapter only when the rendering itself differs: a different file format, a different section structure, extra generated files, or a different bootstrap prompt. When two adapters would render nearly the same content, factor the shared rendering into a helper under `src/agentAdapters/shared/` parameterized by the differing inputs, and have both adapter files call it, rather than duplicating a renderer that must stay byte-for-byte in sync.

### Adapter input

- `effectiveContext`
  - canonical machine-readable build result
  - contains:
    - `metadata.inputs`
    - `persona`
    - `criticalRules`
    - `sections`
    - `skills`
- `instructionsFileName`
  - name of the generated instructions file, from `--output-file`
- `projectPath`
  - target project root

### Adapter output

- `bootstrapPrompt`
  - agent-specific session bootstrap prompt printed by `build` after successful artifact generation
- `files`
  - file path and contents for each generated agent artifact
- `primaryArtifact`
  - main generated file name, for example `AGENTS.md`

`build` refuses to overwrite an existing primary artifact that does not contain the `generatedFileMarker` exported from `src/agentAdapters`, unless `--force-overwrite` is passed. An adapter that writes a markdown instructions file must include that marker so repeated builds do not require the flag.

The CLI passes this output to the artifact writer, which is the only component that writes files to disk.

### Project skill

This project already has a local skill for adding a new adapter:

- `.aie-os/project-skills/add-tool-adapter/SKILL.md`

Use that skill when the intent is to add support for a new tool in this repo.

Typical trigger phrasing:

- add a new adapter for a new tool
- support a new tool
- add a tool adapter

The skill owns the deterministic contributor workflow:

- scaffold the adapter file
- update the static registry
- update the supported tool type
- update CLI tool wiring
- update CLI help text

### What remains manual

After the skill scaffolds the new tool, the contributor still needs to:

- implement the tool-specific rendering logic in the generated adapter file
- replace the placeholder output path, contents, and bootstrap prompt
- build and test the new adapter

### Minimal example

```ts
import type { Adapter } from "../types";

export const exampleAdapter: Adapter = {
  tool: "example",
  async build(input) {
    const contents = [
      "# EXAMPLE",
      "",
      "## Persona",
      "",
      input.effectiveContext.persona.content,
      "",
      "## Critical Rules",
      "",
      ...input.effectiveContext.criticalRules.map((section) => `### ${section.sectionLabel}`),
      "",
      ...input.effectiveContext.sections.map((section) => `## ${section.sectionLabel}`),
      "",
    ].join("\n");

    return {
      bootstrapPrompt: "Read `EXAMPLE.md` before starting work.",
      files: [{ path: "EXAMPLE.md", contents }],
      primaryArtifact: "EXAMPLE.md",
      warnings: [],
    };
  },
};
```

### Registry example

```ts
import { defaultAdapter } from "./default/defaultAdapter";
import { exampleAdapter } from "./example/exampleAdapter";

const adapters = {
  default: defaultAdapter,
  example: exampleAdapter,
};
```

One adapter folder plus one registry line is the intended extension path. The project skill automates the rest of the deterministic setup.
