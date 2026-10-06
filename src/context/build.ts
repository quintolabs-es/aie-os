import path from "node:path";
import {
  fileExists,
  listMarkdownFiles,
  readText,
} from "./filesystem";
import { aieStructure } from "./aieStructure";
import { frontmatter } from "./frontmatter";
import type { Manifest } from "./manifest";
import type {
  EffectiveContext,
  EffectiveContextBlock,
  EffectiveContextInputs,
  EffectiveContextPersona,
  EffectiveContextSkill,
} from "../agentAdapters";

export type BuildInput = {
  manifest: Manifest;
  projectPath: string;
};

export type BuildOutput = {
  effectiveContext: EffectiveContext;
};

type ConditionalAppliesTo = {
  applicationTypes: string[];
  frameworks: string[];
  languages: string[];
};

type LoadedBlocks = {
  criticalRules: EffectiveContextBlock[];
  sections: EffectiveContextBlock[];
};

export async function buildAgentContext(input: BuildInput): Promise<BuildOutput> {
  const resolvedContext = await resolveContext(input);
  const effectiveContext: EffectiveContext = {
    version: "0.1",
    metadata: {
      inputs: toEffectiveContextInputs(input.manifest),
    },
    persona: resolvedContext.persona,
    criticalRules: resolvedContext.criticalRules,
    sections: resolvedContext.sections,
    skills: resolvedContext.skills,
  };

  return {
    effectiveContext,
  };
}

async function resolveContext(input: BuildInput): Promise<{
  criticalRules: EffectiveContextBlock[];
  persona: EffectiveContextPersona;
  sections: EffectiveContextBlock[];
  skills: EffectiveContextSkill[];
}> {
  const criticalRules: EffectiveContextBlock[] = [];
  const sections: EffectiveContextBlock[] = [];
  const skills: EffectiveContextSkill[] = [];
  const projectPath = input.projectPath;
  const knowledgeBasePath = resolveOptionalProjectPath(projectPath, input.manifest.paths.knowledgeBase);
  const agentPath = resolveProjectPath(projectPath, input.manifest.paths.agent);
  const skillsPath = resolveOptionalProjectPath(projectPath, input.manifest.paths.skills);
  const projectCodingRulesPath = resolveProjectPath(
    projectPath,
    input.manifest.paths.projectCodingRules,
  );

  const personaPath = path.join(
    agentPath,
    aieStructure.agent.personaDirectoryName,
    `${input.manifest.selection.persona}${aieStructure.files.markdownExtension}`,
  );
  const personaContents = await readText(personaPath);
  const persona = toPersona(personaContents, personaPath, projectPath);
  const personaIncludes = readPersonaList(
    personaContents,
    aieStructure.personaFrontmatter.includesField,
    personaPath,
  );
  const personaSkillNames = readPersonaList(
    personaContents,
    aieStructure.personaFrontmatter.skillsField,
    personaPath,
  );

  pushLoadedBlocks(
    { criticalRules, sections },
    await loadOptionalDirectoryBlocks(
      path.join(agentPath, aieStructure.agent.universalDirectoryName),
      projectPath,
      "Agent Rules",
      "Agent Rules",
    ),
  );

  const personaIncludesArchitecture = personaIncludes.includes(
    aieStructure.personaFrontmatter.architecturePrinciplesValue,
  );
  const technicalSelection = hasTechnicalSelection(input.manifest.selection);

  if (knowledgeBasePath) {
    pushLoadedBlocks(
      { criticalRules, sections },
      await loadDirectoryBlocks(
        path.join(
          knowledgeBasePath,
          aieStructure.knowledgeBase.generalPrinciplesDirectoryName,
          aieStructure.knowledgeBase.universalDirectoryName,
        ),
        projectPath,
        "Engineering Principles",
        "Engineering Principles",
      ),
    );
  }

  if (knowledgeBasePath && (technicalSelection || personaIncludesArchitecture)) {
    pushLoadedBlocks(
      { criticalRules, sections },
      await loadOptionalDirectoryBlocks(
        path.join(
          knowledgeBasePath,
          aieStructure.knowledgeBase.generalPrinciplesDirectoryName,
          aieStructure.knowledgeBase.architectureDirectoryName,
        ),
        projectPath,
        "Engineering Principles",
        "Engineering Principles",
      ),
    );
  }

  if (knowledgeBasePath && technicalSelection) {
    pushLoadedBlocks(
      { criticalRules, sections },
      await loadDirectoryBlocks(
        path.join(
          knowledgeBasePath,
          aieStructure.knowledgeBase.codingRulesDirectoryName,
          aieStructure.knowledgeBase.universalDirectoryName,
        ),
        projectPath,
        "Shared Coding Rules",
        "Coding Rules",
      ),
    );

    for (const language of input.manifest.selection.languages) {
      pushLoadedBlocks(
        { criticalRules, sections },
        await loadDirectoryBlocks(
          path.join(
            knowledgeBasePath,
            aieStructure.knowledgeBase.codingRulesDirectoryName,
            aieStructure.knowledgeBase.languageDirectoryName,
            language,
          ),
          projectPath,
          "Language Rules",
          `Language: ${language}`,
        ),
      );
    }

    for (const applicationType of input.manifest.selection.applicationTypes) {
      pushLoadedBlocks(
        { criticalRules, sections },
        await loadFileBlock(
          path.join(
            knowledgeBasePath,
            aieStructure.knowledgeBase.codingRulesDirectoryName,
            aieStructure.knowledgeBase.applicationTypeDirectoryName,
            `${applicationType}${aieStructure.files.markdownExtension}`,
          ),
          projectPath,
          "Application-Type Rules",
          `Application Type: ${applicationType}`,
        ),
      );
    }

    for (const framework of input.manifest.selection.frameworks) {
      pushLoadedBlocks(
        { criticalRules, sections },
        await loadFileBlock(
          path.join(
            knowledgeBasePath,
            aieStructure.knowledgeBase.codingRulesDirectoryName,
            aieStructure.knowledgeBase.frameworkDirectoryName,
            `${framework}${aieStructure.files.markdownExtension}`,
          ),
          projectPath,
          "Framework Rules",
          `Framework: ${framework}`,
        ),
      );
    }

    pushLoadedBlocks(
      { criticalRules, sections },
      await loadConditionalBlocks(
        path.join(
          knowledgeBasePath,
          aieStructure.knowledgeBase.codingRulesDirectoryName,
          aieStructure.knowledgeBase.conditionalDirectoryName,
        ),
        projectPath,
        input.manifest.selection,
        "Conditional Coding Rules",
        "Conditional Rules",
      ),
    );
  }

  skills.push(
    ...(await loadPersonaSkills({
      personaName: input.manifest.selection.persona,
      projectPath,
      skillNames: personaSkillNames,
      skillsPath,
    })),
  );

  pushLoadedBlocks(
    { criticalRules, sections },
    await loadDirectoryBlocks(
      projectCodingRulesPath,
      projectPath,
      "Project Coding Rules",
      "Project Coding Rules",
    ),
  );

  return {
    criticalRules,
    persona,
    sections,
    skills,
  };
}

function hasTechnicalSelection(selection: Manifest["selection"]): boolean {
  return (
    selection.languages.length > 0 ||
    selection.applicationTypes.length > 0 ||
    selection.frameworks.length > 0
  );
}

function pushLoadedBlocks(target: LoadedBlocks, loaded: LoadedBlocks): void {
  target.criticalRules.push(...loaded.criticalRules);
  target.sections.push(...loaded.sections);
}

function toEffectiveContextInputs(manifest: Manifest): EffectiveContextInputs {
  return {
    applicationTypes: [...manifest.selection.applicationTypes],
    frameworks: [...manifest.selection.frameworks],
    languages: [...manifest.selection.languages],
    persona: manifest.selection.persona,
    tools: [...manifest.selection.tools],
  };
}

function toPersona(
  contents: string,
  filePath: string,
  projectPath: string,
): EffectiveContextPersona {
  return {
    content: normalizeMarkdownContents(contents),
    source: toOutputFileReference(projectPath, filePath),
  };
}

function readPersonaList(contents: string, fieldName: string, filePath: string): string[] {
  const rawValue = frontmatter.readField(contents, fieldName);

  if (rawValue === "") {
    return [];
  }

  return Array.from(new Set(frontmatter.parseInlineStringArray(rawValue, filePath)));
}

async function loadDirectoryBlocks(
  directoryPath: string,
  projectPath: string,
  layer: string,
  baseSectionLabel: string,
): Promise<LoadedBlocks> {
  const files = await listMarkdownFiles(directoryPath);

  return loadBlocksFromFiles(files, {
    baseDirectory: directoryPath,
    baseSectionLabel,
    layer,
    projectPath,
  });
}

async function loadFileBlock(
  filePath: string,
  projectPath: string,
  layer: string,
  sectionLabel: string,
): Promise<LoadedBlocks> {
  return loadBlocksFromFiles([filePath], {
    baseDirectory: path.dirname(filePath),
    baseSectionLabel: sectionLabel,
    layer,
    projectPath,
  });
}

async function loadOptionalDirectoryBlocks(
  directoryPath: string,
  projectPath: string,
  layer: string,
  baseSectionLabel: string,
): Promise<LoadedBlocks> {
  if (!(await fileExists(directoryPath))) {
    return {
      criticalRules: [],
      sections: [],
    };
  }

  return loadDirectoryBlocks(directoryPath, projectPath, layer, baseSectionLabel);
}

async function loadConditionalBlocks(
  directoryPath: string,
  projectPath: string,
  selection: Manifest["selection"],
  layer: string,
  baseSectionLabel: string,
): Promise<LoadedBlocks> {
  if (!(await fileExists(directoryPath))) {
    return {
      criticalRules: [],
      sections: [],
    };
  }

  const files = await listMarkdownFiles(directoryPath);
  const matchedFiles: string[] = [];

  for (const filePath of files) {
    const contents = await readText(filePath);
    const appliesTo = parseConditionalAppliesTo(contents, filePath);

    if (!appliesTo) {
      continue;
    }

    if (!matchesConditionalAppliesTo(appliesTo, selection)) {
      continue;
    }

    matchedFiles.push(filePath);
  }

  return loadBlocksFromFiles(matchedFiles, {
    baseDirectory: directoryPath,
    baseSectionLabel,
    layer,
    projectPath,
  });
}

async function loadBlocksFromFiles(
  files: string[],
  input: {
    baseDirectory: string;
    baseSectionLabel: string;
    layer: string;
    projectPath: string;
  },
): Promise<LoadedBlocks> {
  const criticalRules: EffectiveContextBlock[] = [];
  const sections: EffectiveContextBlock[] = [];

  for (const filePath of files) {
    const content = normalizeMarkdownContents(await readText(filePath));

    if (content === "") {
      continue;
    }

    const block: EffectiveContextBlock = {
      content,
      layer: input.layer,
      sectionLabel: deriveSectionLabel(
        input.baseDirectory,
        input.baseSectionLabel,
        filePath,
      ),
      source: toOutputFileReference(input.projectPath, filePath),
    };

    if (path.basename(filePath) === aieStructure.files.criticalRulesFileName) {
      criticalRules.push(block);
      continue;
    }

    sections.push(block);
  }

  return {
    criticalRules,
    sections,
  };
}

function deriveSectionLabel(
  baseDirectory: string,
  baseSectionLabel: string,
  filePath: string,
): string {
  const relativeDirectory = path.relative(baseDirectory, path.dirname(filePath));

  if (relativeDirectory === "") {
    return baseSectionLabel;
  }

  return `${baseSectionLabel}: ${relativeDirectory.split(path.sep).join(" / ")}`;
}

async function loadPersonaSkills(input: {
  personaName: string;
  projectPath: string;
  skillNames: string[];
  skillsPath: string | null;
}): Promise<EffectiveContextSkill[]> {
  if (input.skillNames.length === 0) {
    return [];
  }

  if (!input.skillsPath) {
    throw new Error(
      `Persona "${input.personaName}" declares skills but no skills path is configured in the manifest.`,
    );
  }

  const skillsPath = input.skillsPath;

  return Promise.all(
    input.skillNames.map(async (skillName) => {
      const skillDirectory = path.join(skillsPath, skillName);

      if (!(await fileExists(path.join(skillDirectory, aieStructure.files.skillFileName)))) {
        throw new Error(
          `Persona "${input.personaName}" declares unknown skill "${skillName}": expected ${path.join(skillDirectory, aieStructure.files.skillFileName)}`,
        );
      }

      const skillMetadata = await loadSkillMetadata(skillDirectory);

      return {
        description: skillMetadata.description,
        entrypoint: aieStructure.files.skillFileName,
        name: skillName,
        source: toOutputFileReference(input.projectPath, skillDirectory),
        warnings: skillMetadata.warnings,
      };
    }),
  );
}

async function loadSkillMetadata(skillDirectory: string): Promise<{
  description: string;
  warnings: string[];
}> {
  const skillFilePath = path.join(skillDirectory, aieStructure.files.skillFileName);
  if (!(await fileExists(skillFilePath))) {
    return {
      description: "No usage description provided.",
      warnings: [`Skill missing ${aieStructure.files.skillFileName}: ${skillDirectory}`],
    };
  }

  const contents = await readText(skillFilePath);
  const description = frontmatter.readField(contents, "description");

  if (description === "") {
    return {
      description: "No usage description provided.",
      warnings: [
        `Skill missing description in ${aieStructure.files.skillFileName} frontmatter: ${skillDirectory}`,
      ],
    };
  }

  return {
    description,
    warnings: [],
  };
}

function parseConditionalAppliesTo(
  contents: string,
  filePath: string,
): ConditionalAppliesTo | null {
  const frontmatterBlock = frontmatter.readBlock(contents);

  if (!frontmatterBlock) {
    return null;
  }

  const lines = frontmatterBlock.split(/\r?\n/u);
  const rawAppliesToLine = lines.find((line) => line.trimStart().startsWith("applies_to:"));

  if (rawAppliesToLine && rawAppliesToLine.trim() !== "applies_to:") {
    throw new Error(
      `Expected applies_to to use a nested block in conditional coding rule: ${filePath}`,
    );
  }

  const appliesToIndex = lines.findIndex((line) => line.trim() === "applies_to:");

  if (appliesToIndex === -1) {
    return null;
  }

  const appliesToLines: string[] = [];

  for (let index = appliesToIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];

    if (line.startsWith("  ")) {
      appliesToLines.push(line);
      continue;
    }

    if (line.trim() === "") {
      continue;
    }

    break;
  }

  if (appliesToLines.length === 0) {
    return null;
  }

  const parsed: ConditionalAppliesTo = {
    applicationTypes: [],
    frameworks: [],
    languages: [],
  };

  for (const line of appliesToLines) {
    const match = line.match(
      /^  (languages|application_types|frameworks):\s*(.+?)\s*$/u,
    );

    if (!match) {
      throw new Error(
        `Invalid applies_to entry in conditional coding rule: ${filePath}`,
      );
    }

    const values = frontmatter.parseInlineStringArray(match[2], filePath);

    switch (match[1]) {
      case "languages":
        parsed.languages = values;
        break;
      case "application_types":
        parsed.applicationTypes = values;
        break;
      case "frameworks":
        parsed.frameworks = values;
        break;
      default:
        throw new Error(
          `Unsupported applies_to dimension in conditional coding rule: ${filePath}`,
        );
    }
  }

  if (
    parsed.languages.length === 0 &&
    parsed.applicationTypes.length === 0 &&
    parsed.frameworks.length === 0
  ) {
    return null;
  }

  return parsed;
}

function matchesConditionalAppliesTo(
  appliesTo: ConditionalAppliesTo,
  selection: Manifest["selection"],
): boolean {
  return (
    matchesConditionalDimension(selection.languages, appliesTo.languages) &&
    matchesConditionalDimension(selection.applicationTypes, appliesTo.applicationTypes) &&
    matchesConditionalDimension(selection.frameworks, appliesTo.frameworks)
  );
}

function matchesConditionalDimension(selected: string[], required: string[]): boolean {
  if (required.length === 0) {
    return true;
  }

  return required.some((value) => selected.includes(value));
}

function normalizeMarkdownContents(contents: string): string {
  let normalized = contents.replace(/^\uFEFF/u, "");
  normalized = normalized.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n*/u, "");
  normalized = normalized.replace(/^\s*#\s+.*(?:\r?\n)+/u, "");

  return normalized.trim();
}

function resolveProjectPath(projectPath: string, configuredPath: string): string {
  if (path.isAbsolute(configuredPath)) {
    return configuredPath;
  }

  return path.resolve(projectPath, configuredPath);
}

function resolveOptionalProjectPath(
  projectPath: string,
  configuredPath: string,
): string | null {
  if (configuredPath.trim() === "") {
    return null;
  }

  return resolveProjectPath(projectPath, configuredPath);
}

function toOutputFileReference(projectPath: string, filePath: string): string {
  const relativePath = path.relative(projectPath, filePath);

  if (
    relativePath === aieStructure.project.directoryName ||
    relativePath.startsWith(`${aieStructure.project.directoryName}${path.sep}`)
  ) {
    return relativePath;
  }

  return filePath;
}
