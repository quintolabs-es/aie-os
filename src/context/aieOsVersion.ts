import path from "node:path";
import { readText } from "./filesystem";

const tagPattern = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/u;
const packageVersionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/u;

export const aieOsVersion = {
  isTag(value: unknown): value is string {
    return typeof value === "string" && tagPattern.test(value);
  },

  compare(left: string, right: string): number {
    const leftParts = toNumericParts(left);
    const rightParts = toNumericParts(right);

    for (let index = 0; index < leftParts.length; index += 1) {
      if (leftParts[index] !== rightParts[index]) {
        return leftParts[index] - rightParts[index];
      }
    }

    return 0;
  },

  async readRunning(packageRootPath: string): Promise<string> {
    const packageJsonPath = path.join(packageRootPath, "package.json");
    let version: unknown;

    try {
      version = (JSON.parse(await readText(packageJsonPath)) as { version?: unknown }).version;
    } catch {
      version = undefined;
    }

    if (typeof version !== "string" || !packageVersionPattern.test(version)) {
      throw new Error(`Invalid AIE OS package version in ${packageJsonPath}: expected "version" to be X.Y.Z.`);
    }

    return `v${version}`;
  },
};

function toNumericParts(tag: string): readonly number[] {
  const match = tagPattern.exec(tag);

  if (!match) {
    throw new Error(`Expected an AIE OS release tag like v1.2.3, got ${tag}.`);
  }

  return [Number(match[1]), Number(match[2]), Number(match[3])];
}
