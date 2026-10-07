import path from "node:path";
import type { EffectiveContextSkill, SkillCopyItem, SkillInstallTarget } from "../types";

export function planSkillCopies(
  skills: readonly EffectiveContextSkill[],
  target: SkillInstallTarget,
): SkillCopyItem[] {
  return skills.map((skill) => ({
    destination: path.posix.join(target.directory, skill.name),
    excludedFiles: [...target.excludedFiles],
    source: skill.source,
  }));
}
