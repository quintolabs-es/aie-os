import { aieOsVersion } from "./aieOsVersion";
import { fileExists, readText, writeText } from "./filesystem";

const fieldName = "aieOsVersion";

export const manifestAieOsVersion = {
  fieldName,

  async read(manifestPath: string): Promise<string | undefined> {
    const manifest = await readRawManifest(manifestPath);

    if (manifest === undefined || manifest[fieldName] === undefined) {
      return undefined;
    }

    return manifestAieOsVersion.expectTag(manifest[fieldName], manifestPath);
  },

  expectTag(value: unknown, manifestPath: string): string {
    if (!aieOsVersion.isTag(value)) {
      throw new Error(`Expected ${fieldName} to be a release tag like v1.2.3 in manifest: ${manifestPath}`);
    }

    return value;
  },

  async save(manifestPath: string, tag: string): Promise<void> {
    const manifest = await readRawManifest(manifestPath);

    if (manifest === undefined) {
      throw new Error(`Cannot record ${fieldName}: invalid or missing manifest ${manifestPath}`);
    }

    await writeText(manifestPath, `${JSON.stringify(withTag(manifest, tag), null, 2)}\n`);
  },
};

async function readRawManifest(manifestPath: string): Promise<Record<string, unknown> | undefined> {
  if (!(await fileExists(manifestPath))) {
    return undefined;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(await readText(manifestPath));
  } catch {
    return undefined;
  }

  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : undefined;
}

function withTag(manifest: Record<string, unknown>, tag: string): Record<string, unknown> {
  if (fieldName in manifest) {
    return { ...manifest, [fieldName]: tag };
  }

  const ordered: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(manifest)) {
    ordered[key] = value;

    if (key === "version") {
      ordered[fieldName] = tag;
    }
  }

  return fieldName in ordered ? ordered : { [fieldName]: tag, ...ordered };
}
