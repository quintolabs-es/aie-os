import fs from "node:fs";
import path from "node:path";

export function findPackageRoot(startDirectory: string): string {
  let directory = startDirectory;

  while (!fs.existsSync(path.join(directory, "package.json"))) {
    const parent = path.dirname(directory);

    if (parent === directory) {
      throw new Error(`Unable to locate the AIE OS package root from ${startDirectory}`);
    }

    directory = parent;
  }

  return directory;
}
