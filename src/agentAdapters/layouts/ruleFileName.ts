export function ruleFileName(sectionLabel: string): string {
  const slug = sectionLabel
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "");

  return `${slug}.md`;
}
