export const frontmatter = {
  parseInlineStringArray,
  readBlock: readFrontmatterBlock,
  readField: readFrontmatterField,
};

function readFrontmatterField(contents: string, fieldName: string): string {
  const match = contents.match(/^---\r?\n([\s\S]*?)\r?\n---/u);
  if (!match) {
    return "";
  }

  const lines = match[1].split(/\r?\n/u);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const fieldMatch = line.match(new RegExp(`^${fieldName}:(?:\\s*(.*))?$`, "u"));

    if (!fieldMatch) {
      continue;
    }

    const rawValue = (fieldMatch[1] ?? "").trim();
    if (rawValue === "|" || rawValue === ">") {
      const blockLines: string[] = [];
      let nextIndex = index + 1;

      while (nextIndex < lines.length) {
        const nextLine = lines[nextIndex];
        if (!nextLine.startsWith("  ")) {
          break;
        }

        blockLines.push(nextLine.slice(2));
        nextIndex += 1;
      }

      return trimYamlScalar(
        rawValue === ">"
          ? blockLines.join(" ")
          : blockLines.join("\n"),
      );
    }

    return trimYamlScalar(rawValue);
  }

  return "";
}

function readFrontmatterBlock(contents: string): string | null {
  const match = contents.match(/^---\r?\n([\s\S]*?)\r?\n---/u);
  return match ? match[1] : null;
}

function parseInlineStringArray(value: string, filePath: string): string[] {
  const match = value.trim().match(/^\[(.*)\]$/u);

  if (!match) {
    throw new Error(
      `Expected frontmatter values to be inline string arrays: ${filePath}`,
    );
  }

  const inner = match[1].trim();

  if (inner === "") {
    return [];
  }

  return inner
    .split(",")
    .map((item) => trimYamlScalar(item))
    .filter((item) => item !== "");
}

function trimYamlScalar(value: string): string {
  const trimmed = value.trim();
  const quotedMatch = trimmed.match(/^(['"])([\s\S]*)\1$/u);

  if (quotedMatch) {
    return quotedMatch[2].trim();
  }

  return trimmed;
}
