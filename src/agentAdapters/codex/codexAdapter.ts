import { buildMarkdownAdapterOutput } from "../shared/markdownAdapterRenderer";
import type { Adapter, AdapterOutput, ToolProfile } from "../types";

export const codexProfile: ToolProfile = {
  commandsDirectory: null,
  excludedSkillFiles: [],
  instructionsFileName: "AGENTS.md",
  skillsDirectory: ".agents/skills",
};

export const codexAdapter: Adapter = {
  async build(input): Promise<AdapterOutput> {
    return buildMarkdownAdapterOutput(input, codexProfile);
  },
  tool: "codex",
};
