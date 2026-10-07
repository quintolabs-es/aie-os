import path from "node:path";
import { generatedFileMarker } from "../generatedFileMarker";
import { contextSections, type RenderedSection } from "../shared/contextSections";
import { ruleFileName } from "./ruleFileName";
import type { AdapterOutputFile, InstructionsLayout } from "../types";

export type SplitRulesLayoutOptions = {
  instructionsFileName: string;
  rulesDirectory: string;
};

export function splitRulesLayout(options: SplitRulesLayoutOptions): InstructionsLayout {
  return (effectiveContext) => {
    const ruleFiles = toRuleFiles(
      contextSections.renderSections(effectiveContext.sections),
      options.rulesDirectory,
    );

    return {
      bootstrapPrompt: renderBootstrapPrompt(options, ruleFiles),
      instructionsFile: {
        contents: contextSections.joinParts([
          contextSections.renderTitle(options.instructionsFileName),
          contextSections.renderGeneratedHeader(),
          contextSections.renderPersona(effectiveContext),
          contextSections.renderCriticalRules(effectiveContext.criticalRules),
          renderRulesPointer(ruleFiles, options.rulesDirectory),
        ]),
        path: options.instructionsFileName,
      },
      ruleFiles,
    };
  };
}

function toRuleFiles(sections: readonly RenderedSection[], rulesDirectory: string): AdapterOutputFile[] {
  const labelsByFileName = new Map<string, string>();

  return sections.map((section) => {
    const fileName = ruleFileName(section.label);
    const collidingLabel = labelsByFileName.get(fileName);

    if (collidingLabel !== undefined) {
      throw new Error(
        `Sections "${collidingLabel}" and "${section.label}" both map to rule file ${fileName}. Rename one of their content folders.`,
      );
    }

    labelsByFileName.set(fileName, section.label);

    return {
      contents: contextSections.joinParts([generatedFileMarker, section.markdown]),
      path: path.posix.join(rulesDirectory, fileName),
    };
  });
}

function renderRulesPointer(ruleFiles: readonly AdapterOutputFile[], rulesDirectory: string): string {
  if (ruleFiles.length === 0) {
    return "";
  }

  return [
    "## Additional Rules",
    "",
    `Follow every rule file in \`${rulesDirectory}/\`. If they are not already in context, read them before doing any task work.`,
  ].join("\n");
}

function renderBootstrapPrompt(
  options: SplitRulesLayoutOptions,
  ruleFiles: readonly AdapterOutputFile[],
): string {
  const instructionsFile = `\`${options.instructionsFileName}\``;
  const sources = ruleFiles.length === 0
    ? instructionsFile
    : `${instructionsFile} and \`${options.rulesDirectory}/\``;

  return [
    "Before doing any task work in this repository, load and follow the generated repository instructions.",
    `Read ${sources} and treat them as the authoritative instruction set for this repo for the rest of the session.`,
    "If a task conflicts with those instructions, state the conflict and follow the higher-priority rule.",
    `If context is summarized, compacted, or partially lost, reload ${sources} from disk before continuing instead of relying on memory.`,
    "After loading the instructions, continue with the user’s task without restating the files unless asked.",
    "",
    "",
  ].join("\n");
}
