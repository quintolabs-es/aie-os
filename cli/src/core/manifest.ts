import { readText, writeText } from "./files";

export type Manifest = {
  paths: {
    agent: string;
    globalSkills: string;
    knowledgeBase: string;
    projectCodingStandards: string;
    projectContext: string;
    projectSkills: string;
  };
  selection: {
    applicationType: string;
    frameworks: string[];
    language: string;
    persona: string;
    style: string;
  };
  version: number;
};

type ParsedNode = ParsedMap | ParsedList | string;
interface ParsedMap {
  [key: string]: ParsedNode;
}
type ParsedList = string[];

type Token = {
  content: string;
  indent: number;
};

export async function loadManifest(manifestPath: string): Promise<Manifest> {
  const rawManifest = await readText(manifestPath);
  const parsedManifest = parseManifest(rawManifest);

  return normalizeManifest(parsedManifest, manifestPath);
}

export async function saveManifest(
  manifest: Manifest,
  manifestPath: string,
): Promise<void> {
  const lines = [
    "# AIE OS manifest",
    "",
    `version: ${manifest.version}`,
    "paths:",
    `  knowledgeBase: ${quote(manifest.paths.knowledgeBase)}`,
    `  agent: ${quote(manifest.paths.agent)}`,
    `  globalSkills: ${quote(manifest.paths.globalSkills)}`,
    `  projectContext: ${quote(manifest.paths.projectContext)}`,
    `  projectCodingStandards: ${quote(manifest.paths.projectCodingStandards)}`,
    `  projectSkills: ${quote(manifest.paths.projectSkills)}`,
    "selection:",
    `  persona: ${quote(manifest.selection.persona)}`,
    `  style: ${quote(manifest.selection.style)}`,
    `  language: ${quote(manifest.selection.language)}`,
    `  applicationType: ${quote(manifest.selection.applicationType)}`,
    "  frameworks:",
    ...renderList(manifest.selection.frameworks, 4),
    "",
  ];

  await writeText(manifestPath, lines.join("\n"));
}

function renderList(values: string[], indent: number): string[] {
  if (values.length === 0) {
    return [`${" ".repeat(indent)}[]`];
  }

  return values.map((value) => `${" ".repeat(indent)}- ${value}`);
}

function quote(value: string): string {
  return JSON.stringify(value);
}

function parseManifest(rawManifest: string): ParsedMap {
  const tokens = rawManifest
    .split(/\r?\n/u)
    .filter((line) => {
      const trimmed = line.trim();
      return trimmed !== "" && !trimmed.startsWith("#");
    })
    .map((line) => ({
      content: line.trim(),
      indent: line.match(/^ */u)?.[0].length ?? 0,
    }));

  const [node] = parseNode(tokens, 0, 0);
  if (!node || Array.isArray(node) || typeof node === "string") {
    throw new Error("Invalid manifest structure");
  }

  return node;
}

function parseNode(
  tokens: Token[],
  startIndex: number,
  indent: number,
): [ParsedNode, number] {
  const current = tokens[startIndex];
  if (!current) {
    return [{}, startIndex];
  }

  if (current.indent !== indent) {
    throw new Error(`Invalid indentation near "${current.content}"`);
  }

  if (current.content.startsWith("- ")) {
    return parseList(tokens, startIndex, indent);
  }

  return parseMap(tokens, startIndex, indent);
}

function parseMap(
  tokens: Token[],
  startIndex: number,
  indent: number,
): [ParsedMap, number] {
  const value: ParsedMap = {};
  let index = startIndex;

  while (index < tokens.length) {
    const token = tokens[index];
    if (token.indent < indent) {
      break;
    }
    if (token.indent > indent) {
      throw new Error(`Invalid indentation near "${token.content}"`);
    }

    const separatorIndex = token.content.indexOf(":");
    if (separatorIndex === -1) {
      throw new Error(`Invalid manifest entry: ${token.content}`);
    }

    const key = token.content.slice(0, separatorIndex).trim();
    const rawValue = token.content.slice(separatorIndex + 1).trim();

    if (rawValue !== "") {
      value[key] = parseScalar(rawValue);
      index += 1;
      continue;
    }

    if (!tokens[index + 1] || tokens[index + 1].indent <= indent) {
      value[key] = {};
      index += 1;
      continue;
    }

    const [child, nextIndex] = parseNode(tokens, index + 1, indent + 2);
    value[key] = child;
    index = nextIndex;
  }

  return [value, index];
}

function parseList(
  tokens: Token[],
  startIndex: number,
  indent: number,
): [ParsedList, number] {
  const value: ParsedList = [];
  let index = startIndex;

  while (index < tokens.length) {
    const token = tokens[index];
    if (token.indent < indent) {
      break;
    }
    if (token.indent !== indent || !token.content.startsWith("- ")) {
      break;
    }

    value.push(token.content.slice(2).trim());
    index += 1;
  }

  return [value, index];
}

function parseScalar(value: string): ParsedNode {
  if (value === "[]") {
    return [];
  }

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function normalizeManifest(rawManifest: ParsedMap, manifestPath: string): Manifest {
  const paths = expectMap(rawManifest.paths, "paths", manifestPath);
  const selection = expectMap(rawManifest.selection, "selection", manifestPath);

  return {
    version: expectNumber(rawManifest.version, "version", manifestPath),
    paths: {
      knowledgeBase: expectString(paths.knowledgeBase, "paths.knowledgeBase", manifestPath),
      agent: expectString(paths.agent, "paths.agent", manifestPath),
      globalSkills: expectString(paths.globalSkills, "paths.globalSkills", manifestPath),
      projectContext: expectString(paths.projectContext, "paths.projectContext", manifestPath),
      projectCodingStandards: expectString(
        paths.projectCodingStandards,
        "paths.projectCodingStandards",
        manifestPath,
      ),
      projectSkills: expectString(paths.projectSkills, "paths.projectSkills", manifestPath),
    },
    selection: {
      persona: expectString(selection.persona, "selection.persona", manifestPath),
      style: expectString(selection.style, "selection.style", manifestPath),
      language: expectString(selection.language, "selection.language", manifestPath),
      applicationType: expectString(
        selection.applicationType,
        "selection.applicationType",
        manifestPath,
      ),
      frameworks: expectOptionalList(selection.frameworks, "selection.frameworks", manifestPath),
    },
  };
}

function expectString(
  value: ParsedNode | undefined,
  fieldName: string,
  manifestPath: string,
): string {
  if (typeof value !== "string") {
    throw new Error(`Expected ${fieldName} to be a string in manifest: ${manifestPath}`);
  }

  return value;
}

function expectOptionalList(
  value: ParsedNode | undefined,
  fieldName: string,
  manifestPath: string,
): string[] {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new Error(`Expected ${fieldName} to be a list in manifest: ${manifestPath}`);
  }

  return value;
}

function expectMap(
  value: ParsedNode | undefined,
  fieldName: string,
  manifestPath: string,
): ParsedMap {
  if (!value) {
    throw new Error(`Missing ${fieldName} in manifest: ${manifestPath}`);
  }

  if (Array.isArray(value) || typeof value === "string") {
    throw new Error(`Expected ${fieldName} to be an object in manifest: ${manifestPath}`);
  }

  return value;
}

function expectNumber(
  value: ParsedNode | undefined,
  fieldName: string,
  manifestPath: string,
): number {
  if (typeof value !== "string") {
    throw new Error(`Expected ${fieldName} to be a number in manifest: ${manifestPath}`);
  }

  const parsedValue = Number(value);
  if (Number.isNaN(parsedValue)) {
    throw new Error(`Expected ${fieldName} to be a number in manifest: ${manifestPath}`);
  }

  return parsedValue;
}
