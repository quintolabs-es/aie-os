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
  knowledgeBase: {
    applicationTypeDirectoryName: "application-type",
    codingRulesDirectoryName: "coding-rules",
    conditionalDirectoryName: "conditional",
    engineeringPrinciplesDirectoryName: "engineering-principles",
    frameworkDirectoryName: "framework",
    languageDirectoryName: "language",
    universalDirectoryName: "universal",
  },
  project: {
    buildDirectoryName: "build",
    buildSkillsDirectoryName: "skills",
    directoryName: ".aie-os",
    effectiveContextFileName: "effective-context.json",
    manifestFileName: "aie-os.json",
    projectCodingRulesDirectoryName: "project-coding-rules",
    projectSkillsDirectoryName: "project-skills",
  },
} as const;

export const aieRelativePaths = {
  buildDirectory: path.join(
    aieStructure.project.directoryName,
    aieStructure.project.buildDirectoryName,
  ),
  buildSkillsDirectory: path.join(
    aieStructure.project.directoryName,
    aieStructure.project.buildDirectoryName,
    aieStructure.project.buildSkillsDirectoryName,
  ),
  effectiveContextFile: path.join(
    aieStructure.project.directoryName,
    aieStructure.project.buildDirectoryName,
    aieStructure.project.effectiveContextFileName,
  ),
  manifestFile: path.join(
    aieStructure.project.directoryName,
    aieStructure.project.manifestFileName,
  ),
  projectCodingRulesDirectory: path.join(
    aieStructure.project.directoryName,
    aieStructure.project.projectCodingRulesDirectoryName,
  ),
  projectSkillsDirectory: path.join(
    aieStructure.project.directoryName,
    aieStructure.project.projectSkillsDirectoryName,
  ),
} as const;
