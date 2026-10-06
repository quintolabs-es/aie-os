import path from "node:path";
import { adapterTools } from "../agentAdapters";
import { contentPath } from "../context/contentPath";
import { commandName } from "./commandName";
import type { ExecutionOptions, InitExecutionOptions, ParsedOptions } from "./types";

const FLAG_OPTIONS = new Set(["--force-overwrite"]);
const BUILD_OPTIONS = ["--project-path", "--force-overwrite"];
const INIT_OPTIONS = [
  "--project-path",
  "--kb-path",
  "--agent-path",
  "--skills-path",
  "--agent-persona",
  "--tool",
  "--languages",
  "--application-type",
  "--frameworks",
];
const INIT_DEFAULTS = {
  agentPath: contentPath.bundledValue,
  kbPath: contentPath.bundledValue,
  skillsPath: contentPath.bundledValue,
} as const;

export const usageText = `AIE OS

Usage:
  ${commandName} init [options]
  ${commandName} build [options]

  Replace <version> with a release tag, for example v0.1.0. Use the same tag for init and build.

Commands:
  init
    Initialize AIE OS for the target project. With no init config arguments, init prompts interactively. If any init config argument is provided, init becomes explicit and requires all mandatory init options.
  build
    Build the effective context for each selected tool: generate its instructions file and install the persona skills and commands. Build is non-interactive.

Notes:
  - init prompts only when no init configuration arguments are provided.
  - Passing any init configuration argument switches init to explicit mode.
  - In explicit mode, required values must be provided. Omitted content paths default to "${contentPath.bundledValue}"; other omitted optional values are treated as empty.
  - build never prompts and fails explicitly when required values are missing.
  - Content paths default to "${contentPath.bundledValue}": the content shipped with AIE OS. Pass a folder to use your own content, or an empty value to disable knowledge base or skills.

Init options:
  --project-path                    Target repository. Defaults to the current directory.
  --kb-path                         (optional) Knowledge-base path. Defaults to ${contentPath.bundledValue}.
  --agent-path                      (optional) Agent path. Defaults to ${contentPath.bundledValue}.
  --skills-path                     (optional) Skills path. Defaults to ${contentPath.bundledValue}.
  --agent-persona                   Persona. Accepted values are markdown file names from [agent-path]/persona without .md.
  --tool                            Comma-separated agent tools. Accepted values: ${adapterTools.join(", ")}.
  --languages                       (optional) Comma-separated language folder names from [kb-path]/coding-rules/language.
  --application-type                (optional) Comma-separated application-type markdown file names from [kb-path]/coding-rules/application-type without .md.
  --frameworks                      (optional) Comma-separated framework markdown file names from [kb-path]/coding-rules/framework without .md.

Build options:
  --project-path                    Target repository. Defaults to the current directory.
  --force-overwrite                 (optional) Replace instructions files, skills, and commands that were not installed by AIE OS.

Other options:
  -h, --help                        Show help.

Examples:
  ${commandName} init
  ${commandName} init --project-path /repo
  ${commandName} init --agent-persona software-developer --tool claude
  ${commandName} init --agent-persona software-developer --tool claude,codex --languages typescript --application-type cli
  ${commandName} init --kb-path my-content/knowledge-base --agent-path my-content/agent --skills-path my-content/skills --agent-persona software-developer --tool codex
  ${commandName} build
  ${commandName} build --force-overwrite`;

export function parseCommandInput(argv: string[]): ParsedOptions {
  const [command, ...rest] = argv;

  if (!command) {
    return {
      command: null,
      help: false,
      options: {},
    };
  }

  if (command === "-h" || command === "--help") {
    return {
      command: null,
      help: true,
      options: {},
    };
  }

  if (command.startsWith("--")) {
    return {
      command: null,
      help: false,
      options: {},
    };
  }

  if (command !== "init" && command !== "build") {
    throw new Error(`Unknown command: ${command}`);
  }

  const parsed: ParsedOptions = {
    command,
    help: false,
    options: {},
  };

  for (let index = 0; index < rest.length; index += 1) {
    const argument = rest[index];

    if (argument === "-h" || argument === "--help") {
      parsed.help = true;
      continue;
    }

    if (!argument.startsWith("--")) {
      throw new Error(`Unexpected argument: ${argument}`);
    }

    if (FLAG_OPTIONS.has(argument)) {
      parsed.options[argument] = "true";
      continue;
    }

    const value = rest[index + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new Error(`Missing value for option ${argument}`);
    }

    parsed.options[argument] = value;
    index += 1;
  }

  return parsed;
}

export function resolveExecutionOptions(
  parsed: ParsedOptions,
  cwd: string,
): ExecutionOptions {
  if (!parsed.command) {
    throw new Error("You must specify a command.");
  }

  const projectPath = resolveProjectPath(cwd, parsed.options["--project-path"]);

  if (parsed.help) {
    return parsed.command === "init"
      ? {
          command: "init",
          defaults: { ...INIT_DEFAULTS },
          initialSelections: {},
          mode: "interactive",
          providedPaths: {},
          projectPath,
        }
      : {
          command: "build",
          forceOverwrite: false,
          projectPath,
        };
  }

  if (parsed.command === "build") {
    rejectUnsupportedOptions(parsed.options, BUILD_OPTIONS, "build");

    return {
      command: "build",
      forceOverwrite: parsed.options["--force-overwrite"] === "true",
      projectPath,
    };
  }

  rejectUnsupportedOptions(parsed.options, INIT_OPTIONS, "init");

  const defaults = { ...INIT_DEFAULTS };
  const mode = hasExplicitInitConfig(parsed.options) ? "explicit" : "interactive";

  const initOptions: InitExecutionOptions = {
    command: "init",
    defaults,
    initialSelections: {
      applicationTypes: parseCsvSelections(parsed.options["--application-type"]),
      frameworks: parseCsvSelections(parsed.options["--frameworks"]),
      languages: parseCsvSelections(parsed.options["--languages"]),
      persona: normalizeOptionalSelection(parsed.options["--agent-persona"]),
      tools: parseCsvSelections(parsed.options["--tool"]),
    },
    mode,
    providedPaths: {
      agentPath: normalizeCliPathOption(cwd, projectPath, parsed.options["--agent-path"]),
      kbPath: normalizeCliPathOption(cwd, projectPath, parsed.options["--kb-path"]),
      skillsPath: normalizeCliPathOption(cwd, projectPath, parsed.options["--skills-path"]),
    },
    projectPath,
  };

  return initOptions;
}

function hasExplicitInitConfig(options: Record<string, string>): boolean {
  return INIT_OPTIONS.filter((optionName) => optionName !== "--project-path").some((optionName) =>
    Object.prototype.hasOwnProperty.call(options, optionName),
  );
}

function resolveProjectPath(cwd: string, explicitPath?: string): string {
  if (!explicitPath) {
    return cwd;
  }

  return path.resolve(cwd, explicitPath);
}

function rejectUnsupportedOptions(
  options: Record<string, string>,
  allowedOptions: string[],
  commandLabel: string,
): void {
  const unsupported = Object.keys(options).filter((option) => !allowedOptions.includes(option));

  if (unsupported.length === 0) {
    return;
  }

  throw new Error(
    [
      `Unsupported option(s) for ${commandLabel}: ${unsupported.join(", ")}`,
      `Supported options: ${allowedOptions.join(", ")}`,
    ].join("\n"),
  );
}

function parseCsvSelections(value: string | undefined): string[] | undefined {
  if (!value) {
    return undefined;
  }

  const selections = value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry !== "");

  return selections.length === 0 ? undefined : selections;
}

function normalizeOptionalSelection(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim();
  return normalized === "" ? undefined : normalized;
}

function normalizeCliPathOption(
  cwd: string,
  projectPath: string,
  configuredPath: string | undefined,
): string | undefined {
  if (configuredPath === undefined) {
    return undefined;
  }

  if (configuredPath.trim() === "") {
    return "";
  }

  if (contentPath.isBundled(configuredPath)) {
    return contentPath.bundledValue;
  }

  const absolutePath = path.isAbsolute(configuredPath)
    ? configuredPath
    : path.resolve(cwd, configuredPath);

  return toProjectRelative(projectPath, absolutePath);
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
