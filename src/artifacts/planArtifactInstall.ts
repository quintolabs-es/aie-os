import type { AdapterOutput, AdapterOutputFile, SkillCopyItem } from "../agentAdapters";

export type ArtifactInstallPlan = {
  commandFiles: AdapterOutputFile[];
  installedPaths: string[];
  instructionsFiles: AdapterOutputFile[];
  removals: string[];
  skillCopies: SkillCopyItem[];
  warnings: string[];
};

export type ArtifactInstallInput = {
  existingPaths: ReadonlySet<string>;
  forceOverwrite: boolean;
  outputs: AdapterOutput[];
  previouslyInstalled: readonly string[];
};

export function planArtifactInstall(input: ArtifactInstallInput): ArtifactInstallPlan {
  const previous = new Set(input.previouslyInstalled);
  const warnings = input.outputs.flatMap((output) => output.warnings);
  const skillCopies: SkillCopyItem[] = [];
  const commandFiles: AdapterOutputFile[] = [];

  const isInstallable = (target: string): boolean => {
    if (input.forceOverwrite || previous.has(target) || !input.existingPaths.has(target)) {
      return true;
    }

    warnings.push(
      `Skipped ${target}: it exists and was not installed by AIE OS. Pass --force-overwrite to replace it.`,
    );
    return false;
  };

  for (const output of input.outputs) {
    for (const copy of output.skillCopies) {
      if (isInstallable(copy.destination)) {
        skillCopies.push(copy);
      }
    }

    for (const commandFile of output.commandFiles) {
      if (isInstallable(commandFile.path)) {
        commandFiles.push(commandFile);
      }
    }
  }

  const installedPaths = Array.from(
    new Set([
      ...skillCopies.map((copy) => copy.destination),
      ...commandFiles.map((file) => file.path),
    ]),
  ).sort();
  const installedSet = new Set(installedPaths);

  return {
    commandFiles,
    installedPaths,
    instructionsFiles: input.outputs.map((output) => output.instructionsFile),
    removals: input.previouslyInstalled.filter((target) => !installedSet.has(target)),
    skillCopies,
    warnings,
  };
}
