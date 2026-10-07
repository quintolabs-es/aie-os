### Add an adapter

An adapter turns the canonical effective context into the files one agent tool expects. It is a composition of strategies, not a renderer with tool checks.

```ts
export const exampleAdapter = createAdapter({
  commands: noCommands,                       // or slashCommands("<commands-dir>")
  layout: singleFileLayout("EXAMPLE.md"),     // or splitRulesLayout({ instructionsFileName, rulesDirectory })
  skills: { directory: ".example/skills", excludedFiles: [] },
  tool: "example",
});
```

Steps:
1. add the tool key to `adapterTools` in `src/agentAdapters/types.ts`
2. create `src/agentAdapters/<tool>/<tool>Adapter.ts` composing existing strategies with `createAdapter`
3. add the adapter to the registry map in `src/agentAdapters/index.ts`
4. add tests for the generated files

Write a new strategy only when no existing one fits, and keep it free of tool checks:
- a layout is an `InstructionsLayout` under `src/agentAdapters/layouts/`
- a command renderer is a `CommandRenderer` under `src/agentAdapters/commands/`

An adapter must not discover source files, decide which content is included, re-run build logic, or write files directly.

### Strategies

| Strategy | Contract | Implementations |
|---|---|---|
| Layout | `InstructionsLayout`: effective context → instructions file, rule files, bootstrap prompt | `singleFileLayout` (one file with every section, used by `codex`), `splitRulesLayout` (persona and critical rules in the instructions file, one rule file per section, used by `claude`) |
| Commands | `CommandRenderer`: skills → command files | `noCommands`, `slashCommands(<dir>)` |
| Skills | `SkillInstallTarget`: install folder and files to exclude | data, applied by `planSkillCopies` |

Both layouts render sections with the same `contextSections` helpers, so section content is identical across tools.

### Adapter input

- `effectiveContext`: the canonical build result (`metadata.inputs`, `persona`, `criticalRules`, `sections`, `skills`)

### Adapter output

- `bootstrapPrompt`: printed by `build` after a successful run
- `instructionsFile`: path and contents of the instructions file, for example `CLAUDE.md`
- `ruleFiles`: path and contents of each rule file (empty for single-file layouts)
- `commandFiles`: path and contents of each command file (empty when the tool has no commands)
- `skillCopies`: source skill reference, destination folder, and files to exclude. The source is a portable reference (`bundled:<path>`, project-relative, or absolute); the artifact writer resolves it with `contentPath.fromReference`
- `warnings`

### Write policies

The artifact writer is the only component that writes files. Each output field has one fixed policy:

| Output | Overwrite guard | Tracked in `installed-artifacts.json` | On conflict with a file AIE OS did not write |
|---|---|---|---|
| `instructionsFile` | `generatedFileMarker` | no | build fails unless `--force-overwrite` |
| `ruleFiles` | `generatedFileMarker` | yes, removed when no longer generated | build fails unless `--force-overwrite` |
| `commandFiles`, `skillCopies` | ledger | yes, removed when no longer generated | skipped with a warning unless `--force-overwrite` |

Instructions and rule files must contain `generatedFileMarker` from `src/agentAdapters` so repeated builds do not need `--force-overwrite`.
