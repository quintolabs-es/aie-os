import { claudeAdapter } from "./claude/claudeAdapter";
import { codexAdapter } from "./codex/codexAdapter";
import type { Adapter, AdapterTool } from "./types";

const adapters = {
  claude: claudeAdapter,
  codex: codexAdapter,
} satisfies Record<AdapterTool, Adapter>;

export function getAdapter(tool: AdapterTool): Adapter {
  const adapter = adapters[tool];

  if (!adapter) {
    throw new Error(`Unsupported tool: ${tool}`);
  }

  return adapter;
}

export { generatedFileMarker } from "./generatedFileMarker";
export { adapterTools } from "./types";

export type {
  Adapter,
  AdapterTool,
  AdapterInput,
  AdapterOutput,
  AdapterOutputFile,
  EffectiveContextBlock,
  EffectiveContext,
  EffectiveContextSkill,
  EffectiveContextInputs,
  EffectiveContextMetadata,
  EffectiveContextPersona,
  CommandRenderer,
  InstructionsLayout,
  InstructionsLayoutOutput,
  SkillCopyItem,
  SkillInstallTarget,
} from "./types";
