import { planSkillCopies } from "./shared/planSkillCopies";
import type {
  Adapter,
  AdapterOutput,
  AdapterTool,
  CommandRenderer,
  InstructionsLayout,
  SkillInstallTarget,
} from "./types";

export type AdapterDefinition = {
  commands: CommandRenderer;
  layout: InstructionsLayout;
  skills: SkillInstallTarget;
  tool: AdapterTool;
};

export function createAdapter(definition: AdapterDefinition): Adapter {
  return {
    async build({ effectiveContext }): Promise<AdapterOutput> {
      const layoutOutput = definition.layout(effectiveContext);

      return {
        bootstrapPrompt: layoutOutput.bootstrapPrompt,
        commandFiles: definition.commands(effectiveContext.skills, definition.skills.directory),
        instructionsFile: layoutOutput.instructionsFile,
        ruleFiles: layoutOutput.ruleFiles,
        skillCopies: planSkillCopies(effectiveContext.skills, definition.skills),
        warnings: effectiveContext.skills.flatMap((skill) => skill.warnings),
      };
    },
    tool: definition.tool,
  };
}
