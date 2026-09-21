import { buildMarkdownAdapterOutput } from "../shared/markdownAdapterRenderer";
import type { Adapter, AdapterOutput } from "../types";

export const defaultAdapter: Adapter = {
  async build(input): Promise<AdapterOutput> {
    return buildMarkdownAdapterOutput(input, input.instructionsFileName);
  },
  tool: "default",
};
