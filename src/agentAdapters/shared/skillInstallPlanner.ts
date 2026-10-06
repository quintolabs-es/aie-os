import path from "node:path";
import type {
  AdapterOutputFile,
  EffectiveContext,
  SkillCopyItem,
  ToolProfile,
} from "../types";

export type SkillInstallPlan = {
  commandFiles: AdapterOutputFile[];
  skillCopies: SkillCopyItem[];
};

export function planSkillInstall(
  effectiveContext: EffectiveContext,
  profile: ToolProfile,
): SkillInstallPlan {
  const skillCopies = effectiveContext.skills.map((skill) => ({
    destination: path.posix.join(profile.skillsDirectory, skill.name),
    excludedFiles: [...profile.excludedSkillFiles],
    source: skill.source,
  }));

  const commandFiles = profile.commandsDirectory === null
    ? []
    : effectiveContext.skills.map((skill) => ({
        contents: renderCommand(skill.name, skill.description, profile.skillsDirectory, skill.entrypoint),
        path: path.posix.join(profile.commandsDirectory as string, `${skill.name}.md`),
      }));

  return {
    commandFiles,
    skillCopies,
  };
}

function renderCommand(
  skillName: string,
  description: string,
  skillsDirectory: string,
  entrypoint: string,
): string {
  return [
    "---",
    `description: ${JSON.stringify(description)}`,
    "---",
    "",
    `Use the \`${skillName}\` skill (\`${path.posix.join(skillsDirectory, skillName, entrypoint)}\`) for this request.`,
    "",
    "$ARGUMENTS",
    "",
  ].join("\n");
}
