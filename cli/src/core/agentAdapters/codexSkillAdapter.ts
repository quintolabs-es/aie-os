import path from "node:path";
import type { AdapterInput, SkillAdapterOutput } from "./types";

const BUILD_SKILLS_DIRECTORY = path.join(".aie-os", "build", "skills");

export const codexSkillAdapter = {
  build(input: AdapterInput): SkillAdapterOutput {
    const copies = input.effectiveContext.skills.map((skill) => ({
      destination: path.join(BUILD_SKILLS_DIRECTORY, skill.scope, skill.name),
      source: skill.source,
    }));

    if (input.effectiveContext.skills.length === 0) {
      return {
        copies,
        markdown: "",
      };
    }

    return {
      copies,
      markdown: [
        "## Available Skills",
        "",
        "Use a skill when the user explicitly names it or when the task clearly matches the \"When to use\" description.",
        "Open the referenced `SKILL.md` only when needed. Load additional files from the same skill folder only if needed.",
        "",
        ...input.effectiveContext.skills.map((skill, index) => [
          `### ${index + 1}. ${skill.name}`,
          "",
          `- Where to find it: ${path.join(BUILD_SKILLS_DIRECTORY, skill.scope, skill.name, skill.entrypoint)}`,
          `- When to use it: ${skill.description}`,
          `- Source: ${skill.scope}`,
        ].join("\n")),
        "",
      ].join("\n"),
    };
  },
};
