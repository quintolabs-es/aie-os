import path from "node:path";
import { generatedFileMarker } from "../generatedFileMarker";
import type { EffectiveContext, EffectiveContextBlock } from "../types";

const aieOsVersionPointer =
  "Run AIE OS for this project with the release tag recorded as `aieOsVersion` in `.aie-os/aie-os.json`.";

export type RenderedSection = {
  label: string;
  markdown: string;
};

export const contextSections = {
  renderTitle(instructionsFileName: string): string {
    return `# ${path.basename(instructionsFileName, path.extname(instructionsFileName))}`;
  },

  renderGeneratedHeader(): string {
    return `${generatedFileMarker}\n${aieOsVersionPointer}`;
  },

  renderPersona(effectiveContext: EffectiveContext): string {
    return ["## Persona", "", effectiveContext.persona.content].join("\n");
  },

  renderCriticalRules(blocks: readonly EffectiveContextBlock[]): string {
    if (blocks.length === 0) {
      return "";
    }

    const parts = ["## Critical Rules"];

    for (const group of groupBlocksBySectionLabel(blocks)) {
      parts.push("", `### ${group.sectionLabel}`);

      for (const block of group.blocks) {
        parts.push("", block.content);
      }
    }

    return parts.join("\n");
  },

  renderSections(blocks: readonly EffectiveContextBlock[]): RenderedSection[] {
    return groupBlocksBySectionLabel(blocks, toRenderedSectionLabel).map((group) => {
      const parts = [`## ${group.sectionLabel}`];

      for (const [index, block] of group.blocks.entries()) {
        if (index > 0) {
          parts.push("", `### ${toBlockHeading(block.source)}`);
        }

        parts.push("", block.content);
      }

      return {
        label: group.sectionLabel,
        markdown: parts.join("\n"),
      };
    });
  },

  joinParts(parts: readonly string[]): string {
    return parts
      .filter((part) => part !== "")
      .join("\n\n")
      .concat("\n");
  },
};

type BlockGroup = {
  blocks: EffectiveContextBlock[];
  sectionLabel: string;
};

function toBlockHeading(source: string): string {
  const baseName = path.basename(source, path.extname(source));

  return baseName
    .replace(/^\d+-/u, "")
    .split("-")
    .filter((word) => word !== "")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function groupBlocksBySectionLabel(
  blocks: readonly EffectiveContextBlock[],
  normalizeSectionLabel: (sectionLabel: string) => string = (sectionLabel) => sectionLabel,
): BlockGroup[] {
  const groups: BlockGroup[] = [];
  const seen = new Map<string, BlockGroup>();

  for (const block of blocks) {
    const sectionLabel = normalizeSectionLabel(block.sectionLabel);
    const existing = seen.get(sectionLabel);

    if (existing) {
      existing.blocks.push(block);
      continue;
    }

    const group = {
      blocks: [block],
      sectionLabel,
    };

    seen.set(sectionLabel, group);
    groups.push(group);
  }

  return groups;
}

function toRenderedSectionLabel(sectionLabel: string): string {
  if (sectionLabel === "Conditional Rules") {
    return "Coding Rules";
  }

  return sectionLabel;
}
