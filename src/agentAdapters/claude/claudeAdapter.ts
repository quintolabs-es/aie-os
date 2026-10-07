import { slashCommands } from "../commands/slashCommands";
import { createAdapter } from "../createAdapter";
import { splitRulesLayout } from "../layouts/splitRulesLayout";

export const claudeAdapter = createAdapter({
  commands: slashCommands(".claude/commands/aie"),
  layout: splitRulesLayout({
    instructionsFileName: "CLAUDE.md",
    rulesDirectory: ".claude/rules/aie",
  }),
  skills: {
    directory: ".claude/skills",
    excludedFiles: ["agents/openai.yaml"],
  },
  tool: "claude",
});
