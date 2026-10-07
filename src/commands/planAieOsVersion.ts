import { aieOsVersion } from "../context/aieOsVersion";
import { aieRelativePaths } from "../context/aieStructure";

export type PlanAieOsVersionInput = {
  readonly command: "build" | "init";
  readonly pinnedTag: string | undefined;
  readonly runningTag: string;
};

export type AieOsVersionPlan =
  | { readonly kind: "keep" }
  | { readonly kind: "record"; readonly notice: string; readonly tag: string }
  | { readonly kind: "refuse"; readonly message: string };

export function planAieOsVersion(input: PlanAieOsVersionInput): AieOsVersionPlan {
  const manifestFile = aieRelativePaths.manifestFile;
  const followUp = `Run init and build for this project with tag ${input.runningTag}, and commit ${manifestFile}.`;

  if (input.pinnedTag === undefined) {
    return {
      kind: "record",
      notice: `Recorded AIE OS ${input.runningTag} in ${manifestFile} ("aieOsVersion"). ${followUp}`,
      tag: input.runningTag,
    };
  }

  const comparison = aieOsVersion.compare(input.runningTag, input.pinnedTag);

  if (comparison === 0) {
    return { kind: "keep" };
  }

  if (comparison > 0) {
    return {
      kind: "record",
      notice: `Upgraded AIE OS in ${manifestFile} ("aieOsVersion") from ${input.pinnedTag} to ${input.runningTag}. ${followUp}`,
      tag: input.runningTag,
    };
  }

  return {
    kind: "refuse",
    message: [
      `Refusing to ${input.command} with AIE OS ${input.runningTag}: ${manifestFile} requires ${input.pinnedTag} ("aieOsVersion").`,
      `Rerun the same command with tag ${input.pinnedTag}.`,
    ].join("\n"),
  };
}
