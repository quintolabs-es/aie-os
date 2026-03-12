import type { Manifest } from "../manifest";

export type AdapterTool = "codex";

export type ParsedSourceBlocks = {
  criticalRules: string[];
  examples: string[];
  forbiddenPatterns: string[];
  preferredPatterns: string[];
  purpose: string[];
  rules: string[];
  unclassified: string[];
};

export type EffectiveContextSection = {
  file: string;
  heading: string;
  layer: string;
  parsed: ParsedSourceBlocks;
  source: string;
};

export type EffectiveContextSkillScope = "project" | "shared";

export type EffectiveContextSkill = {
  description: string;
  entrypoint: string;
  name: string;
  scope: EffectiveContextSkillScope;
  source: string;
  warnings: string[];
};

export type EffectiveContext = {
  manifest: Manifest;
  sections: EffectiveContextSection[];
  skills: EffectiveContextSkill[];
  version: string;
};

export type AdapterInput = {
  effectiveContext: EffectiveContext;
  projectPath: string;
};

export type AdapterOutputFile = {
  contents: string;
  path: string;
};

export type SkillCopyItem = {
  destination: string;
  source: string;
};

export type SkillAdapterOutput = {
  copies: SkillCopyItem[];
  markdown: string;
};

export type AdapterOutput = {
  files: AdapterOutputFile[];
  primaryArtifact: string;
  skillAdapterOutput?: SkillAdapterOutput;
  warnings: string[];
};

export type Adapter = {
  tool: AdapterTool;
  build: (input: AdapterInput) => Promise<AdapterOutput>;
};
