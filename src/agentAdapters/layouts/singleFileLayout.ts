import { contextSections } from "../shared/contextSections";
import type { InstructionsLayout } from "../types";

export function singleFileLayout(instructionsFileName: string): InstructionsLayout {
  return (effectiveContext) => ({
    bootstrapPrompt: renderBootstrapPrompt(instructionsFileName),
    instructionsFile: {
      contents: contextSections.joinParts([
        contextSections.renderTitle(instructionsFileName),
        contextSections.renderGeneratedHeader(),
        contextSections.renderPersona(effectiveContext),
        contextSections.renderCriticalRules(effectiveContext.criticalRules),
        contextSections
          .renderSections(effectiveContext.sections)
          .map((section) => section.markdown)
          .join("\n\n"),
      ]),
      path: instructionsFileName,
    },
    ruleFiles: [],
  });
}

function renderBootstrapPrompt(instructionsFileName: string): string {
  return [
    "Before doing any task work in this repository, load and follow the generated repository instructions.",
    `Read \`${instructionsFileName}\` at the repo root and treat it as the authoritative instruction set for this repo for the rest of the session.`,
    "If a task conflicts with those instructions, state the conflict and follow the higher-priority rule.",
    `If context is summarized, compacted, or partially lost, reload \`${instructionsFileName}\` from disk before continuing instead of relying on memory.`,
    "After loading the instructions, continue with the user’s task without restating the full file unless asked.",
    "",
    "",
  ].join("\n");
}
