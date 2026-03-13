#!/usr/bin/env node

import path from "node:path";
import { buildProject } from "./commands/build";
import { initProject } from "./commands/init";
import { parseCommandInput, resolveExecutionOptions, usageText } from "./commands/commandLine";

async function run(): Promise<void> {
  const commandInput = parseCommandInput(process.argv.slice(2));

  if (commandInput.help) {
    process.stdout.write(`${usageText}\n`);
    return;
  }

  const executionOptions = resolveExecutionOptions(commandInput, path.resolve(process.cwd()));

  switch (executionOptions.command) {
    case "init":
      await initProject(executionOptions);
      return;
    case "build":
      await buildProject(executionOptions);
      return;
    default:
      throw new Error(`Unsupported command: ${commandInput.command}`);
  }
}

run().catch((error: unknown) => {
  if (error instanceof Error) {
    process.stderr.write(`${error.message}\n`);
  } else {
    process.stderr.write("Unknown error\n");
  }
  process.exitCode = 1;
});
