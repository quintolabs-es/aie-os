import path from "node:path";
import { writeText } from "./files";
import type { AdapterOutput } from "./agentAdapters";

export const agentArtifactWriter = {
  async write(projectPath: string, output: AdapterOutput): Promise<void> {
    await Promise.all(
      output.files.map((file) =>
        writeText(path.join(projectPath, file.path), file.contents),
      ),
    );
  },
};
