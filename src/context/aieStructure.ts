import path from "node:path";

export const aieStructure = {
  agent: {
    personaDirectoryName: "persona",
    universalDirectoryName: "universal",
  },
  files: {
    criticalRulesFileName: "critical-rules.md",
    markdownExtension: ".md",
    readmeFileName: "README.md",
    skillFileName: "SKILL.md",
  },
  personaFrontmatter: {
    architecturePrinciplesValue: "architecture-principles",
    includesField: "includes",
    skillsField: "skills",
  },
  knowledgeBase: {
    applicationTypeDirectoryName: "application-type",
    architectureDirectoryName: "architecture",
    codingRulesDirectoryName: "coding-rules",
    conditionalDirectoryName: "conditional",
    frameworkDirectoryName: "framework",
    generalPrinciplesDirectoryName: "general-principles",
    languageDirectoryName: "language",
    universalDirectoryName: "universal",
  },
  project: {
    buildDirectoryName: "build",
    directoryName: ".aie-os",
    effectiveContextFileName: "effective-context.json",
    installedArtifactsFileName: "installed-artifacts.json",
    manifestFileName: "aie-os.json",
    projectCodingRulesDirectoryName: "project-coding-rules",
  },
} as const;

export const aieRelativePaths = {
  buildDirectory: path.join(
    aieStructure.project.directoryName,
    aieStructure.project.buildDirectoryName,
  ),
  effectiveContextFile: path.join(
    aieStructure.project.directoryName,
    aieStructure.project.buildDirectoryName,
    aieStructure.project.effectiveContextFileName,
  ),
  installedArtifactsFile: path.join(
    aieStructure.project.directoryName,
    aieStructure.project.buildDirectoryName,
    aieStructure.project.installedArtifactsFileName,
  ),
  manifestFile: path.join(
    aieStructure.project.directoryName,
    aieStructure.project.manifestFileName,
  ),
  projectCodingRulesDirectory: path.join(
    aieStructure.project.directoryName,
    aieStructure.project.projectCodingRulesDirectoryName,
  ),
} as const;
