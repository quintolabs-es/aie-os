import { noCommands } from "../commands/noCommands";
import { createAdapter } from "../createAdapter";
import { singleFileLayout } from "../layouts/singleFileLayout";

export const codexAdapter = createAdapter({
  commands: noCommands,
  layout: singleFileLayout("AGENTS.md"),
  skills: {
    directory: ".agents/skills",
    excludedFiles: [],
  },
  tool: "codex",
});
