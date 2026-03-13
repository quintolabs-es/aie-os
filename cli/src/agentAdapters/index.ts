import { codexAdapter } from "./codexAdapter";
import type { Adapter, AdapterTool } from "./types";

const adapters = {
  codex: codexAdapter,
} satisfies Record<AdapterTool, Adapter>;

export function getAdapter(tool: AdapterTool): Adapter {
  const adapter = adapters[tool];

  if (!adapter) {
    throw new Error(`Unsupported tool: ${tool}`);
  }

  return adapter;
}

export type {
  Adapter,
  AdapterTool,
  AdapterInput,
  AdapterOutput,
  AdapterOutputFile,
  EffectiveContext,
  ParsedSourceBlocks,
  EffectiveContextSkill,
  EffectiveContextSkillScope,
  EffectiveContextSection,
  SkillAdapterOutput,
  SkillCopyItem,
} from "./types";
