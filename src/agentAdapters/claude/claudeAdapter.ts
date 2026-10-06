import { buildMarkdownAdapterOutput } from "../shared/markdownAdapterRenderer";
import type { Adapter, AdapterOutput, ToolProfile } from "../types";

export const claudeProfile: ToolProfile = {
  commandsDirectory: ".claude/commands/aie",
  excludedSkillFiles: ["agents/openai.yaml"],
  instructionsFileName: "CLAUDE.md",
  skillsDirectory: ".claude/skills",
};

export const claudeAdapter: Adapter = {
  async build(input): Promise<AdapterOutput> {
    return buildMarkdownAdapterOutput(input, claudeProfile);
  },
  tool: "claude",
};
