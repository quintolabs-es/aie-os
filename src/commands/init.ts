import fsSync from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { stdout as output } from "node:process";
import {
  ensureDirectory,
  fileExists,
  listDirectoryNames,
  listMarkdownBasenames,
  writeText,
} from "../context/filesystem";
import { adapterTools } from "../agentAdapters";
import { aieRelativePaths, aieStructure } from "../context/aieStructure";
import { contentPath, type ContentKind } from "../context/contentPath";
import { saveManifest, type Manifest } from "../context/manifest";
import { manifestAieOsVersion } from "../context/manifestAieOsVersion";
import { projectCodingRulesReadmeTemplate } from "./scaffoldTemplates";
import {
  canPromptInteractively,
  promptMultiSelect,
  promptSingleSelect,
  promptTextInput,
} from "./terminalPrompts";
import { commandName } from "./commandName";
import { planAieOsVersion } from "./planAieOsVersion";
import { planInitManifest } from "./planInitManifest";
import type { InitExecutionOptions, InitPromptDefaults, InitSelections } from "./types";

export async function initProject(options: InitExecutionOptions, runningTag: string): Promise<void> {
  await ensureProjectDirectory(options.projectPath);
  const canPrompt = options.mode === "interactive" && canPromptInteractively();
  if (options.mode === "interactive" && !canPrompt) {
    throw new Error("Init requires a terminal when no init configuration arguments are provided.");
  }
  const versionPlan = planAieOsVersion({
    command: "init",
    pinnedTag: await manifestAieOsVersion.read(path.join(options.projectPath, aieRelativePaths.manifestFile)),
    runningTag,
  });
  if (versionPlan.kind === "refuse") {
    throw new Error(versionPlan.message);
  }
  const manifest = await collectManifest(
    options.projectPath,
    options.defaults,
    options.initialSelections,
    options.mode,
    options.providedPaths,
    canPrompt,
    runningTag,
  );
  await scaffoldProject(options.projectPath, manifest);
  if (versionPlan.kind === "record") {
    output.write(`${versionPlan.notice}\n`);
  }
}

async function collectManifest(
  projectPath: string,
  defaults: InitPromptDefaults,
  initialSelections: Partial<InitSelections>,
  mode: InitExecutionOptions["mode"],
  providedPaths: Partial<InitPromptDefaults>,
  interactive: boolean,
  runningTag: string,
): Promise<Manifest> {
  const knowledgeBasePath = providedPaths.kbPath !== undefined
    ? providedPaths.kbPath
    : interactive
      ? await promptPath({
          allowEmpty: true,
          contentKind: "knowledgeBase",
          defaultValue: defaults.kbPath,
          description: `AIE OS reads shared engineering principles and coding rules from this folder. Keep "${contentPath.bundledValue}" to use the content shipped with AIE OS, or leave it empty to disable the knowledge-base layer. Principles always load; coding rules load only when a language, application type, or framework is selected.`,
          promptLabel: "knowledge base path",
          optionName: "--kb-path",
          projectPath,
        })
      : defaults.kbPath;
  await ensureContentDirectory(projectPath, knowledgeBasePath, "knowledgeBase", "Knowledge base path");

  const agentPath = providedPaths.agentPath !== undefined
    ? providedPaths.agentPath
    : interactive
      ? await promptPath({
          contentKind: "agent",
          defaultValue: defaults.agentPath,
          description: `AIE OS reads persona definitions from this folder. Keep "${contentPath.bundledValue}" to use the content shipped with AIE OS.`,
          promptLabel: "agent path",
          optionName: "--agent-path",
          projectPath,
        })
      : defaults.agentPath;
  if (agentPath.trim() === "") {
    throw new Error("Agent path cannot be empty.");
  }
  await ensureContentDirectory(projectPath, agentPath, "agent", "Agent path");

  const skillsPath = providedPaths.skillsPath !== undefined
    ? normalizeConfiguredPath(projectPath, providedPaths.skillsPath)
    : interactive
      ? await promptPath({
          allowEmpty: true,
          contentKind: "skills",
          defaultValue: defaults.skillsPath,
          description: `AIE OS installs the skills declared by the persona from this folder. Keep "${contentPath.bundledValue}" to use the skills shipped with AIE OS, or leave it empty to disable skills.`,
          promptLabel: "skills path",
          optionName: "--skills-path",
          projectPath,
        })
      : defaults.skillsPath;
  await ensureContentDirectory(projectPath, skillsPath, "skills", "Skills path");

  const selections = await collectSelections(
    projectPath,
    {
      agentPath,
      initialSelections,
      knowledgeBasePath,
      mode,
    },
    interactive,
  );

  return planInitManifest({
    aieOsVersion: runningTag,
    defaults,
    paths: {
      agentPath,
      kbPath: knowledgeBasePath,
      skillsPath,
    },
    selections,
  });
}

async function collectSelections(
  projectPath: string,
  input: {
    agentPath: string;
    initialSelections: Partial<InitSelections>;
    knowledgeBasePath: string;
    mode: InitExecutionOptions["mode"];
  },
  interactive: boolean,
): Promise<InitSelections> {
  const resolvedAgentPath = contentPath.resolve(projectPath, input.agentPath, "agent") as string;
  const resolvedKnowledgeBasePath = contentPath.resolve(
    projectPath,
    input.knowledgeBasePath,
    "knowledgeBase",
  );

  const personaOptions = await listMarkdownBasenames(
    path.join(resolvedAgentPath, aieStructure.agent.personaDirectoryName),
  );
  const languageOptions = resolvedKnowledgeBasePath
    ? await listDirectoryNames(
        path.join(
          resolvedKnowledgeBasePath,
          aieStructure.knowledgeBase.codingRulesDirectoryName,
          aieStructure.knowledgeBase.languageDirectoryName,
        ),
      )
    : [];
  const applicationTypeOptions = resolvedKnowledgeBasePath
    ? await listMarkdownBasenames(
        path.join(
          resolvedKnowledgeBasePath,
          aieStructure.knowledgeBase.codingRulesDirectoryName,
          aieStructure.knowledgeBase.applicationTypeDirectoryName,
        ),
      )
    : [];
  const frameworkOptions = resolvedKnowledgeBasePath
    ? await listMarkdownBasenames(
        path.join(
          resolvedKnowledgeBasePath,
          aieStructure.knowledgeBase.codingRulesDirectoryName,
          aieStructure.knowledgeBase.frameworkDirectoryName,
        ),
      )
    : [];
  const initial = input.initialSelections;

  const persona =
    validateSingleSelection(initial.persona, personaOptions, "agent persona") ??
    (interactive
      ? await promptSingleSelect({
          command: "init",
          defaultValue: personaOptions.includes("software-developer")
            ? "software-developer"
            : (personaOptions[0] ?? null),
          explanation: "Persona defines the agent role and behavioral mode.",
          label: "Select persona",
          options: personaOptions,
        })
      : missingRequiredInitOption("--agent-persona", input.mode));

  const tools =
    validateMultiSelection(initial.tools, [...adapterTools], "tools", false) ??
    (interactive
      ? await promptMultiSelect({
          allowEmpty: false,
          command: "init",
          defaultValue: [],
          explanation: "Tools select the agents to build for: instructions file, skills, and commands.",
          label: "Select tools",
          options: [...adapterTools],
        })
      : missingRequiredInitOption("--tool", input.mode));

  const languages = resolvedKnowledgeBasePath
    ? validateMultiSelection(initial.languages, languageOptions, "languages", true) ??
      (interactive
        ? await promptMultiSelect({
            allowEmpty: true,
            command: "init",
            defaultValue: languageOptions.length === 1 ? [languageOptions[0]] : [],
            explanation: "Select one or more languages. This supports monorepos.",
            label: "Select languages",
            options: languageOptions,
          })
        : [])
    : validateMultiSelection(initial.languages, [], "languages", true) ?? [];

  const applicationTypes = resolvedKnowledgeBasePath
    ? validateMultiSelection(initial.applicationTypes, applicationTypeOptions, "application types", true) ??
      (interactive
        ? await promptMultiSelect({
            allowEmpty: true,
            command: "init",
            defaultValue: [],
            explanation: "Application type selects rules for the shape of the application, such as api or cli.",
            label: "Select application types",
            options: applicationTypeOptions,
          })
        : [])
    : validateMultiSelection(initial.applicationTypes, [], "application types", true) ?? [];

  const frameworks = resolvedKnowledgeBasePath
    ? validateMultiSelection(initial.frameworks, frameworkOptions, "frameworks", true) ??
      (interactive
        ? await promptMultiSelect({
            allowEmpty: true,
            command: "init",
            defaultValue: [],
            explanation: "Framework overlays add framework-specific coding rules.",
            label: "Select frameworks",
            options: frameworkOptions,
          })
        : [])
    : validateMultiSelection(initial.frameworks, [], "frameworks", true) ?? [];

  return {
    applicationTypes,
    frameworks,
    languages,
    persona,
    tools,
  };
}

async function scaffoldProject(projectPath: string, manifest: Manifest): Promise<void> {
  const aieDirectory = path.join(projectPath, aieStructure.project.directoryName);
  await ensureDirectory(aieDirectory);

  const projectCodingRulesPath = resolveAgainstProject(projectPath, manifest.paths.projectCodingRules);

  await ensureDirectory(projectCodingRulesPath);
  await writeTemplateIfMissing(
    path.join(projectCodingRulesPath, aieStructure.files.readmeFileName),
    projectCodingRulesReadmeTemplate,
  );

  await saveManifest(manifest, path.join(aieDirectory, aieStructure.project.manifestFileName));
  output.write(`
              .-"""-.
             / .===. \\
             \\/ 6 6 \\/
             ( \\___/ )
        ___ooo__V__ooo___
       /                 \\
      |   [  AIE-OS  ]   |
       \\_________________/

     AIE-OS PROJECT HAS BEEN INITIALIZED

           *      .      *      .
        .     *     .      *      *
          *      \\  |  /      .
        .      --- * ---       *
          *      /  |  \\     .
        .    *      .      *     .

AIE OS project created at ${path.join(projectPath, aieStructure.project.directoryName)}.
Existing project-specific rules in ${manifest.paths.projectCodingRules} are kept.
`);
}

async function writeTemplateIfMissing(targetPath: string, content: string): Promise<void> {
  if (await fileExists(targetPath)) {
    return;
  }

  await writeText(targetPath, content);
}

async function promptPath(inputOptions: {
  allowEmpty?: boolean;
  contentKind: ContentKind;
  defaultValue: string;
  description: string;
  promptLabel: string;
  optionName: string;
  projectPath: string;
}): Promise<string> {
  let errorMessage: string | undefined;
  let currentValue = inputOptions.defaultValue;

  while (true) {
    const rawValue = await promptTextInput({
      command: "init",
      defaultValue: currentValue,
      description: inputOptions.description,
      errorMessage,
      optionName: inputOptions.optionName,
      promptLabel: inputOptions.promptLabel,
      submitHint: inputOptions.allowEmpty
        ? "Enter to accept, delete to empty and disable, type to replace, or press Esc to cancel."
        : "Press Enter to accept the default, type a new value, or press Esc to cancel.",
    });

    const trimmedValue = rawValue.trim();
    const normalizedValue = trimmedValue === ""
      ? (inputOptions.allowEmpty ? "" : inputOptions.defaultValue)
      : normalizeConfiguredPath(inputOptions.projectPath, trimmedValue);

    if (normalizedValue === "") {
      return "";
    }

    try {
      await ensureContentDirectory(
        inputOptions.projectPath,
        normalizedValue,
        inputOptions.contentKind,
        capitalizeLabel(inputOptions.promptLabel),
      );
      return normalizedValue;
    } catch (error) {
      currentValue = rawValue.trim() === "" ? currentValue : rawValue.trim();
      errorMessage = error instanceof Error ? error.message : "Invalid path.";
    }
  }
}


function validateSingleSelection(
  selectedValue: string | undefined,
  options: string[],
  label: string,
  allowNone = false,
): string | undefined {
  if (!selectedValue) {
    return undefined;
  }

  if (allowNone && selectedValue === "none") {
    return "none";
  }

  if (!options.includes(selectedValue)) {
    throw new Error(`Unsupported ${label}: ${selectedValue}`);
  }

  return selectedValue;
}

function missingRequiredInitOption(
  optionName: string,
  mode: InitExecutionOptions["mode"],
): never {
  if (mode === "explicit") {
    throw new Error(
      `Missing required option ${optionName}. Because init was started with explicit configuration arguments, all required init options must be provided.`,
    );
  }

  throw new Error(
    `Missing required option ${optionName}. Run "${commandName} init" in a terminal.`,
  );
}

function capitalizeLabel(label: string): string {
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function validateMultiSelection(
  selectedValues: string[] | undefined,
  options: string[],
  label: string,
  allowNone: boolean,
): string[] | undefined {
  if (!selectedValues) {
    return undefined;
  }

  const invalidSelections = selectedValues.filter((value) => !options.includes(value));
  if (invalidSelections.length > 0) {
    throw new Error(`Unsupported ${label}: ${invalidSelections.join(", ")}`);
  }

  return Array.from(new Set(selectedValues));
}

function normalizeConfiguredPath(projectPath: string, configuredPath: string): string {
  if (configuredPath.trim() === "") {
    return "";
  }

  if (contentPath.isBundled(configuredPath)) {
    return contentPath.bundledValue;
  }

  if (path.isAbsolute(configuredPath)) {
    return configuredPath;
  }

  return toProjectRelative(projectPath, path.resolve(projectPath, configuredPath));
}


function resolveAgainstProject(projectPath: string, configuredPath: string): string {
  if (path.isAbsolute(configuredPath)) {
    return configuredPath;
  }

  return path.resolve(projectPath, configuredPath);
}

function toProjectRelative(projectPath: string, absolutePath: string): string {
  const relativePath = path.relative(projectPath, absolutePath);

  if (relativePath === "") {
    return ".";
  }

  if (contentPath.isBundled(relativePath)) {
    return `.${path.sep}${relativePath}`;
  }

  if (!relativePath.startsWith("..")) {
    return relativePath;
  }

  return absolutePath;
}

async function ensureContentDirectory(
  projectPath: string,
  configuredPath: string,
  kind: ContentKind,
  label: string,
): Promise<void> {
  const resolvedPath = contentPath.resolve(projectPath, configuredPath, kind);

  if (resolvedPath) {
    await ensureDirectoryType(resolvedPath, label);
  }
}

async function ensureProjectDirectory(projectPath: string): Promise<void> {
  await ensureDirectoryType(projectPath, "Project path");
}

async function ensureDirectoryType(directoryPath: string, label: string): Promise<void> {
  let stats;

  try {
    stats = await fs.stat(directoryPath);
  } catch {
    throw new Error(`${label} does not exist: ${directoryPath}`);
  }

  if (!stats.isDirectory()) {
    throw new Error(`${label} is not a directory: ${directoryPath}`);
  }
}

function pathExists(targetPath: string): boolean {
  return fsSync.existsSync(targetPath);
}
