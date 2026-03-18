import path from "node:path";
import fs from "node:fs/promises";
import { stdout as output } from "node:process";
import { getAdapter } from "../agentAdapters";
import { agentArtifactWriter } from "../artifacts/agentArtifactWriter";
import { buildAgentContext } from "../context/build";
import { fileExists, writeText } from "../context/filesystem";
import { loadManifest } from "../context/manifest";
import type { BuildExecutionOptions } from "./types";

const PROJECT_AIE_DIRECTORY = ".aie-os";
const BUILD_DIRECTORY = "build";
const MANIFEST_NAME = "aie-os.json";

export async function buildProject(options: BuildExecutionOptions): Promise<void> {
  await ensureProjectDirectory(options.projectPath);

  const manifestPath = path.join(options.projectPath, PROJECT_AIE_DIRECTORY, MANIFEST_NAME);
  if (!(await fileExists(manifestPath))) {
    throw new Error(`Missing manifest: ${manifestPath}. Run "init" from the target project first.`);
  }

  const manifest = await loadManifest(manifestPath);
  const buildOutput = await buildAgentContext({
    manifest,
    projectPath: options.projectPath,
    tool: options.tool,
  });
  const adapter = getAdapter(options.tool);
  const adapterOutput = await adapter.build({
    effectiveContext: buildOutput.effectiveContext,
    projectPath: options.projectPath,
  });

  await writeText(
    path.join(options.projectPath, PROJECT_AIE_DIRECTORY, BUILD_DIRECTORY, "effective-context.json"),
    `${JSON.stringify(buildOutput.effectiveContext, null, 2)}\n`,
  );
  await fs.rm(
    path.join(options.projectPath, PROJECT_AIE_DIRECTORY, BUILD_DIRECTORY, "effective-context.md"),
    { force: true },
  );

  await agentArtifactWriter.write(options.projectPath, adapterOutput);

  output.write(
    `\nBuild complete. Generated .aie-os/build/effective-context.json and ${adapterOutput.primaryArtifact}.\n`,
  );
}

async function ensureProjectDirectory(projectPath: string): Promise<void> {
  await ensureDirectoryType(projectPath, "Project path");
}

async function ensureDirectoryType(directoryPath: string, label: string): Promise<void> {
  const fs = await import("node:fs/promises");
  let stats;

  try {
    stats = await fs.stat(directoryPath);
  } catch {
    throw new Error(`${label} does not exist: ${directoryPath}`);
  }

  if (!stats.isDirectory()) {
    throw new Error(`${label} is not a directory: ${directoryPath}`);
  }
}
