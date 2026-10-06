export const adapterTools = ["claude", "codex"] as const;

export type AdapterTool = (typeof adapterTools)[number];

export type EffectiveContextBlock = {
  content: string;
  layer: string;
  sectionLabel: string;
  source: string;
};

export type EffectiveContextPersona = {
  content: string;
  source: string;
};

export type EffectiveContextInputs = {
  applicationTypes: string[];
  frameworks: string[];
  languages: string[];
  persona: string;
  tools: string[];
};

export type EffectiveContextMetadata = {
  inputs: EffectiveContextInputs;
};

export type EffectiveContextSkill = {
  description: string;
  entrypoint: string;
  name: string;
  source: string;
  warnings: string[];
};

export type EffectiveContext = {
  version: string;
  metadata: EffectiveContextMetadata;
  persona: EffectiveContextPersona;
  criticalRules: EffectiveContextBlock[];
  sections: EffectiveContextBlock[];
  skills: EffectiveContextSkill[];
};

export type AdapterInput = {
  effectiveContext: EffectiveContext;
};

export type AdapterOutputFile = {
  contents: string;
  path: string;
};

export type SkillCopyItem = {
  destination: string;
  excludedFiles: string[];
  source: string;
};

export type AdapterOutput = {
  bootstrapPrompt: string;
  commandFiles: AdapterOutputFile[];
  instructionsFile: AdapterOutputFile;
  skillCopies: SkillCopyItem[];
  warnings: string[];
};

export type ToolProfile = {
  commandsDirectory: string | null;
  excludedSkillFiles: string[];
  instructionsFileName: string;
  skillsDirectory: string;
};

export type Adapter = {
  tool: AdapterTool;
  build: (input: AdapterInput) => Promise<AdapterOutput>;
};
