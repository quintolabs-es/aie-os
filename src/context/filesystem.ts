import fs from "node:fs/promises";
import path from "node:path";
import { aieStructure } from "./aieStructure";

export async function ensureDirectory(directoryPath: string): Promise<void> {
  await fs.mkdir(directoryPath, {
    recursive: true,
  });
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readText(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    throw new Error(`Unable to read file: ${filePath}`);
  }
}

export async function writeText(filePath: string, contents: string): Promise<void> {
  await ensureDirectory(path.dirname(filePath));
  await fs.writeFile(filePath, contents, "utf8");
}

export async function copyDirectory(
  sourcePath: string,
  destinationPath: string,
  excludedRelativePaths: string[] = [],
): Promise<void> {
  const excluded = new Set(excludedRelativePaths.map((entry) => path.normalize(entry)));

  await ensureDirectory(path.dirname(destinationPath));
  await removePath(destinationPath);
  await fs.cp(sourcePath, destinationPath, {
    filter: (entryPath) => !excluded.has(path.relative(sourcePath, entryPath)),
    force: true,
    recursive: true,
  });

  for (const excludedPath of excluded) {
    await removeEmptyDirectory(path.dirname(path.join(destinationPath, excludedPath)), destinationPath);
  }
}

export async function removePath(targetPath: string): Promise<void> {
  await fs.rm(targetPath, {
    force: true,
    recursive: true,
  });
}

async function removeEmptyDirectory(directoryPath: string, stopAtPath: string): Promise<void> {
  if (path.resolve(directoryPath) === path.resolve(stopAtPath)) {
    return;
  }

  try {
    await fs.rmdir(directoryPath);
  } catch {
    // Directory is missing or not empty; leave it in place.
  }
}

export async function listDirectoryNames(directoryPath: string): Promise<string[]> {
  const entries = await fs.readdir(directoryPath, {
    withFileTypes: true,
  });

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export async function listMarkdownBasenames(directoryPath: string): Promise<string[]> {
  const entries = await fs.readdir(directoryPath, {
    withFileTypes: true,
  });

  return entries
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.endsWith(aieStructure.files.markdownExtension) &&
        entry.name !== aieStructure.files.readmeFileName,
    )
    .map((entry) =>
      entry.name.replace(
        new RegExp(`${aieStructure.files.markdownExtension.replace(".", "\\.")}$`, "u"),
        "",
      ),
    )
    .sort();
}

export async function listMarkdownFiles(directoryPath: string): Promise<string[]> {
  const entries = await fs.readdir(directoryPath, {
    withFileTypes: true,
  });

  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directoryPath, entry.name);

      if (entry.isDirectory()) {
        return listMarkdownFiles(entryPath);
      }

      if (
        entry.isFile() &&
        entry.name.endsWith(aieStructure.files.markdownExtension) &&
        entry.name !== aieStructure.files.readmeFileName
      ) {
        return [entryPath];
      }

      return [];
    }),
  );

  return files.flat().sort();
}
