import fs from "node:fs";
import path from "node:path";

export type ContentKind = "agent" | "knowledgeBase" | "skills";

const bundledValue = "bundled";
const bundledReferencePrefix = `${bundledValue}:`;
const bundledContentDirectoryName = "content";
const bundledDirectoryNames: Readonly<Record<ContentKind, string>> = {
  agent: "agent",
  knowledgeBase: "knowledge-base",
  skills: "skills",
};

export const contentPath = {
  bundledValue,

  isBundled(configuredPath: string): boolean {
    return configuredPath.trim() === bundledValue;
  },

  resolve(projectPath: string, configuredPath: string, kind: ContentKind): string | null {
    const trimmed = configuredPath.trim();

    if (trimmed === "") {
      return null;
    }

    if (trimmed === bundledValue) {
      return path.join(bundledContentRoot(), bundledDirectoryNames[kind]);
    }

    return path.isAbsolute(trimmed) ? trimmed : path.resolve(projectPath, trimmed);
  },

  toReference(projectPath: string, filePath: string): string {
    const relativeToProject = path.relative(projectPath, filePath);

    if (isInside(relativeToProject)) {
      return toPosix(relativeToProject);
    }

    const relativeToBundled = path.relative(bundledContentRoot(), filePath);

    if (isInside(relativeToBundled)) {
      return `${bundledReferencePrefix}${toPosix(relativeToBundled)}`;
    }

    return filePath;
  },

  fromReference(projectPath: string, reference: string): string {
    if (reference.startsWith(bundledReferencePrefix)) {
      return path.join(bundledContentRoot(), reference.slice(bundledReferencePrefix.length));
    }

    return path.isAbsolute(reference) ? reference : path.resolve(projectPath, reference);
  },
};

function bundledContentRoot(): string {
  return path.join(findPackageRoot(__dirname), bundledContentDirectoryName);
}

function findPackageRoot(startDirectory: string): string {
  let directory = startDirectory;

  while (!fs.existsSync(path.join(directory, "package.json"))) {
    const parent = path.dirname(directory);

    if (parent === directory) {
      throw new Error(`Unable to locate the AIE OS package root from ${startDirectory}`);
    }

    directory = parent;
  }

  return directory;
}

function isInside(relativePath: string): boolean {
  return relativePath !== "" && !relativePath.startsWith("..") && !path.isAbsolute(relativePath);
}

function toPosix(relativePath: string): string {
  return relativePath.split(path.sep).join("/");
}
