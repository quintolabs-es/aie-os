import path from "node:path";
import {
  fileExists,
  listDirectoryNames,
  listMarkdownFiles,
  readText,
} from "./files";
import type { Manifest } from "./manifest";
import type {
  EffectiveContext,
  EffectiveContextSection,
  EffectiveContextSkill,
  EffectiveContextSkillScope,
} from "./agentAdapters";

export type BuildInput = {
  manifest: Manifest;
  projectPath: string;
  tool: "codex";
};

export type BuildOutput = {
  effectiveContext: EffectiveContext;
  effectiveContextMarkdown: string;
  manifest: Manifest;
  tool: "codex";
};

export async function buildAgentContext(input: BuildInput): Promise<BuildOutput> {
  const resolvedContext = await resolveContext(input);
  const effectiveContext: EffectiveContext = {
    manifest: input.manifest,
    sections: resolvedContext.sections,
    skills: resolvedContext.skills,
    version: "0.1",
  };

  return {
    effectiveContext,
    effectiveContextMarkdown: await renderEffectiveContextMarkdown({
      effectiveContext,
      projectPath: input.projectPath,
      title: "# Agent Context",
      tool: input.tool,
    }),
    manifest: input.manifest,
    tool: input.tool,
  };
}

async function resolveContext(input: BuildInput): Promise<{
  sections: EffectiveContextSection[];
  skills: EffectiveContextSkill[];
}> {
  const sections: EffectiveContextSection[] = [];
  const skills: EffectiveContextSkill[] = [];
  const projectPath = input.projectPath;
  const knowledgeBasePath = resolveProjectPath(projectPath, input.manifest.paths.knowledgeBase);
  const agentPath = resolveProjectPath(projectPath, input.manifest.paths.agent);
  const skillsPath = resolveOptionalProjectPath(
    projectPath,
    input.manifest.paths.skills,
  );
  const projectCodingStandardsPath = resolveProjectPath(
    projectPath,
    input.manifest.paths.projectCodingStandards,
  );
  const projectSkillsPath = resolveProjectPath(projectPath, input.manifest.paths.projectSkills);

  sections.push(
    ...(await loadDirectorySections(
      path.join(knowledgeBasePath, "engineering-principles", "universal"),
      projectPath,
      "Engineering Principles",
    )),
  );

  sections.push(
    ...(await loadDirectorySections(
      path.join(knowledgeBasePath, "coding-standards", "universal"),
      projectPath,
      "Shared Coding Standards",
    )),
  );

  for (const language of input.manifest.selection.languages) {
    sections.push(
      ...(await loadDirectorySections(
        path.join(knowledgeBasePath, "coding-standards", "language", language),
        projectPath,
        "Language Standards",
      )),
    );
  }

  for (const applicationType of input.manifest.selection.applicationTypes) {
    sections.push(
      ...(await loadDirectorySections(
        path.join(
          knowledgeBasePath,
          "coding-standards",
          "application-type",
          applicationType,
        ),
        projectPath,
        "Application-Type Standards",
      )),
    );
  }

  for (const framework of input.manifest.selection.frameworks) {
    sections.push(
      ...(await loadDirectorySections(
        path.join(knowledgeBasePath, "coding-standards", "framework", framework),
        projectPath,
        "Framework Standards",
      )),
    );
  }

  if (skillsPath) {
    skills.push(...(await loadSkillDefinitions(skillsPath, projectPath, "shared")));
  }

  sections.push(
    ...(await loadDirectorySections(
      projectCodingStandardsPath,
      projectPath,
      "Project Coding Standards",
    )),
  );

  skills.push(...(await loadSkillDefinitions(projectSkillsPath, projectPath, "project")));

  sections.push(
    await loadSingleFileSection(
      path.join(agentPath, "style", `${input.manifest.selection.style}.md`),
      projectPath,
      input.manifest.selection.style,
      "Response Style",
    ),
  );

  sections.push(
    await loadSingleFileSection(
      path.join(agentPath, "persona", `${input.manifest.selection.persona}.md`),
      projectPath,
      input.manifest.selection.persona,
      "Persona",
    ),
  );

  return {
    sections,
    skills,
  };
}

async function loadDirectorySections(
  directoryPath: string,
  projectPath: string,
  layer: string,
): Promise<EffectiveContextSection[]> {
  const files = await listMarkdownFiles(directoryPath);

  return Promise.all(
    files.map(async (filePath) => ({
      file: toOutputFileReference(projectPath, filePath),
      heading: path.basename(filePath, ".md"),
      layer,
      source: path.relative(projectPath, filePath),
    })),
  );
}

async function loadSkillDefinitions(
  directoryPath: string,
  projectPath: string,
  scope: EffectiveContextSkillScope,
): Promise<EffectiveContextSkill[]> {
  const skillNames = await listDirectoryNames(directoryPath);

  return Promise.all(
    skillNames.map(async (skillName) => {
      const skillDirectory = path.join(directoryPath, skillName);
      const skillMetadata = await loadSkillMetadata(skillDirectory);

      return {
        description: skillMetadata.description,
        entrypoint: "SKILL.md",
        name: skillName,
        scope,
        source: toOutputFileReference(projectPath, skillDirectory),
        warnings: skillMetadata.warnings,
      };
    }),
  );
}

async function loadSkillMetadata(skillDirectory: string): Promise<{
  description: string;
  warnings: string[];
}> {
  const skillFilePath = path.join(skillDirectory, "SKILL.md");
  if (!(await fileExists(skillFilePath))) {
    return {
      description: "No usage description provided.",
      warnings: [`Skill missing SKILL.md: ${skillDirectory}`],
    };
  }

  const contents = await readText(skillFilePath);
  const description = readFrontmatterField(contents, "description");

  if (description === "") {
    return {
      description: "No usage description provided.",
      warnings: [`Skill missing description in SKILL.md frontmatter: ${skillDirectory}`],
    };
  }

  return {
    description,
    warnings: [],
  };
}

function readFrontmatterField(contents: string, fieldName: string): string {
  const match = contents.match(/^---\r?\n([\s\S]*?)\r?\n---/u);
  if (!match) {
    return "";
  }

  const lines = match[1].split(/\r?\n/u);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const fieldMatch = line.match(new RegExp(`^${fieldName}:(?:\\s*(.*))?$`, "u"));

    if (!fieldMatch) {
      continue;
    }

    const rawValue = (fieldMatch[1] ?? "").trim();
    if (rawValue === "|" || rawValue === ">") {
      const blockLines: string[] = [];
      let nextIndex = index + 1;

      while (nextIndex < lines.length) {
        const nextLine = lines[nextIndex];
        if (!nextLine.startsWith("  ")) {
          break;
        }

        blockLines.push(nextLine.slice(2));
        nextIndex += 1;
      }

      return trimYamlScalar(
        rawValue === ">"
          ? blockLines.join(" ")
          : blockLines.join("\n"),
      );
    }

    return trimYamlScalar(rawValue);
  }

  return "";
}

function trimYamlScalar(value: string): string {
  const trimmed = value.trim();
  const quotedMatch = trimmed.match(/^(['"])([\s\S]*)\1$/u);

  if (quotedMatch) {
    return quotedMatch[2].trim();
  }

  return trimmed;
}

async function loadSingleFileSection(
  filePath: string,
  projectPath: string,
  heading: string,
  layer: string,
): Promise<EffectiveContextSection> {
  return {
    file: toOutputFileReference(projectPath, filePath),
    heading,
    layer,
    source: path.relative(projectPath, filePath),
  };
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

export async function renderEffectiveContextMarkdown(input: {
  effectiveContext: EffectiveContext;
  note?: string;
  projectPath: string;
  title: string;
  tool: "codex";
}): Promise<string> {
  const buildInputs = [
    `- Tool: ${input.tool}`,
    `- Persona: ${input.effectiveContext.manifest.selection.persona}`,
    `- Style: ${input.effectiveContext.manifest.selection.style}`,
    `- Languages: ${formatList(input.effectiveContext.manifest.selection.languages)}`,
    `- Application types: ${formatList(input.effectiveContext.manifest.selection.applicationTypes)}`,
    `- Frameworks: ${formatList(input.effectiveContext.manifest.selection.frameworks)}`,
    `- Knowledge base path: ${input.effectiveContext.manifest.paths.knowledgeBase}`,
    `- Agent path: ${input.effectiveContext.manifest.paths.agent}`,
    `- Skills path: ${formatValue(input.effectiveContext.manifest.paths.skills)}`,
    `- Project coding standards path: ${input.effectiveContext.manifest.paths.projectCodingStandards}`,
    `- Project skills path: ${input.effectiveContext.manifest.paths.projectSkills}`,
  ].join("\n");

  const renderedSkills = input.effectiveContext.skills.length === 0
    ? ["## Skills", "", "_None_"].join("\n")
    : [
      "## Skills",
      "",
      ...input.effectiveContext.skills.map((skill, index) => [
        `### ${index + 1}. ${formatSkillScope(skill.scope)}: ${skill.name}`,
        "",
        `- Source: \`${skill.source}\``,
        `- Entry point: \`${skill.entrypoint}\``,
        `- Description: ${skill.description}`,
      ].join("\n")),
    ].join("\n\n");

  const renderedSections = input.effectiveContext.sections
    .map(async (section, index) =>
      [
        `## ${index + 1}. ${section.layer}: ${section.heading}`,
        "",
        `Source: \`${section.source}\``,
        "",
        (await readText(resolveSectionFilePath(input.projectPath, section.file))).trim(),
      ].join("\n"),
    );

  const resolvedSections = await Promise.all(renderedSections);

  return [
    input.title,
    "",
    "This file is generated by AIE OS. Do not edit directly.",
    "Higher-precedence sections appear first. Later sections may refine earlier sections but must not contradict them.",
    "",
    ...(input.note ? [input.note, ""] : []),
    "## Build Inputs",
    "",
    buildInputs,
    "",
    renderedSkills,
    "",
    resolvedSections.join("\n\n"),
    "",
  ].join("\n");
}

function formatList(items: string[]): string {
  if (items.length === 0) {
    return "none";
  }

  return items.join(", ");
}

function formatSkillScope(scope: EffectiveContextSkillScope): string {
  return scope === "project" ? "Project Skills" : "Skills";
}

function formatValue(value: string): string {
  return value.trim() === "" ? "none" : value;
}

function toOutputFileReference(projectPath: string, filePath: string): string {
  const relativePath = path.relative(projectPath, filePath);

  if (relativePath === ".aie-os" || relativePath.startsWith(`.aie-os${path.sep}`)) {
    return relativePath;
  }

  return filePath;
}

function resolveSectionFilePath(projectPath: string, fileReference: string): string {
  if (path.isAbsolute(fileReference)) {
    return fileReference;
  }

  return path.resolve(projectPath, fileReference);
}
