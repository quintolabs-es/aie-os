import path from "node:path";
import { stdout as output } from "node:process";
import { aieRelativePaths } from "../context/aieStructure";
import { copyDirectory, fileExists, readText, removePath, writeText } from "../context/filesystem";
import { planArtifactInstall } from "./planArtifactInstall";
import type { AdapterOutput } from "../agentAdapters";

export type ArtifactWriteOptions = {
  forceOverwrite: boolean;
};

export const agentArtifactWriter = {
  async write(
    projectPath: string,
    outputs: AdapterOutput[],
    options: ArtifactWriteOptions,
  ): Promise<void> {
    const previouslyInstalled = await loadInstalledPaths(projectPath);
    const candidatePaths = outputs.flatMap((adapterOutput) => [
      ...adapterOutput.skillCopies.map((copy) => copy.destination),
      ...adapterOutput.commandFiles.map((file) => file.path),
    ]);
    const existingPaths = new Set<string>();

    for (const candidatePath of candidatePaths) {
      if (await fileExists(resolveInsideProject(projectPath, candidatePath))) {
        existingPaths.add(candidatePath);
      }
    }

    const plan = planArtifactInstall({
      existingPaths,
      forceOverwrite: options.forceOverwrite,
      outputs,
      previouslyInstalled,
    });

    for (const removal of plan.removals) {
      await removePath(resolveInsideProject(projectPath, removal));
    }

    for (const copy of plan.skillCopies) {
      await copyDirectory(
        resolveSourcePath(projectPath, copy.source),
        resolveInsideProject(projectPath, copy.destination),
        copy.excludedFiles,
      );
    }

    for (const file of [...plan.instructionsFiles, ...plan.commandFiles]) {
      await writeText(resolveInsideProject(projectPath, file.path), file.contents);
    }

    await writeText(
      path.join(projectPath, aieRelativePaths.installedArtifactsFile),
      `${JSON.stringify({ paths: plan.installedPaths }, null, 2)}\n`,
    );

    plan.warnings.forEach((warning) => {
      output.write(`Warning: ${warning}\n`);
    });
  },
};

async function loadInstalledPaths(projectPath: string): Promise<string[]> {
  const ledgerPath = path.join(projectPath, aieRelativePaths.installedArtifactsFile);

  if (!(await fileExists(ledgerPath))) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(await readText(ledgerPath));
  } catch {
    throw new Error(`Invalid JSON installed-artifacts file: ${ledgerPath}`);
  }

  const paths = (parsed as { paths?: unknown } | null)?.paths;
  if (!Array.isArray(paths) || paths.some((entry) => typeof entry !== "string")) {
    throw new Error(`Expected paths to be a string array in: ${ledgerPath}`);
  }

  return paths as string[];
}

function resolveInsideProject(projectPath: string, relativePath: string): string {
  const resolvedPath = path.resolve(projectPath, relativePath);
  const relativeToProject = path.relative(projectPath, resolvedPath);

  if (relativeToProject === "" || relativeToProject.startsWith("..") || path.isAbsolute(relativeToProject)) {
    throw new Error(`Refusing to touch a path outside the project: ${relativePath}`);
  }

  return resolvedPath;
}

function resolveSourcePath(projectPath: string, sourcePath: string): string {
  return path.isAbsolute(sourcePath) ? sourcePath : path.resolve(projectPath, sourcePath);
}
