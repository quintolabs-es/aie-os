import { aieRelativePaths } from "../context/aieStructure";
import type { Manifest } from "../context/manifest";
import type { InitExecutionOptions, InitPromptDefaults, InitSelections } from "./types";

export type PlanInitManifestInput = {
  defaults: InitPromptDefaults;
  mode: InitExecutionOptions["mode"];
  paths: Partial<InitPromptDefaults>;
  selections: InitSelections;
};

export function planInitManifest(input: PlanInitManifestInput): Manifest {
  const agentPath = input.paths.agentPath !== undefined
    ? input.paths.agentPath
    : input.defaults.agentPath;
  const knowledgeBasePath = input.paths.kbPath !== undefined
    ? input.paths.kbPath
    : input.defaults.kbPath;
  const skillsPath = input.paths.skillsPath !== undefined
    ? input.paths.skillsPath
    : input.mode === "interactive"
      ? input.defaults.skillsPath
      : "";

  return {
    version: "0.1",
    paths: {
      agent: agentPath,
      skills: skillsPath,
      knowledgeBase: knowledgeBasePath,
      projectCodingRules: aieRelativePaths.projectCodingRulesDirectory,
      projectSkills: aieRelativePaths.projectSkillsDirectory,
    },
    selection: {
      applicationTypes: [...input.selections.applicationTypes],
      frameworks: [...input.selections.frameworks],
      languages: [...input.selections.languages],
      persona: input.selections.persona,
    },
  };
}
