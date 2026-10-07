const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const { splitRulesLayout } = require(path.join(
  __dirname,
  "..",
  "dist",
  "agentAdapters",
  "layouts",
  "splitRulesLayout.js",
));

const layout = splitRulesLayout({ instructionsFileName: "CLAUDE.md", rulesDirectory: ".claude/rules/aie" });

function contextWithSections(sectionLabels) {
  return {
    criticalRules: [],
    metadata: { inputs: {} },
    persona: { content: "You are a tester.", source: "persona.md" },
    sections: sectionLabels.map((sectionLabel, index) => ({
      content: `- Rule ${index}.`,
      layer: "Test",
      sectionLabel,
      source: `rules-${index}.md`,
    })),
    skills: [],
    version: "0.1",
  };
}

test("Split rules layout names rule files after section labels with separators", () => {
  const output = layout(contextWithSections(["Project Coding Rules: api / v2", "Language: c#"]));

  assert.deepEqual(
    output.ruleFiles.map((ruleFile) => ruleFile.path),
    [".claude/rules/aie/project-coding-rules-api-v2.md", ".claude/rules/aie/language-c.md"],
  );
});

test("Split rules layout rejects two sections that map to the same rule file", () => {
  assert.throws(
    () => layout(contextWithSections(["Language: c#", "Language: c"])),
    /Sections "Language: c#" and "Language: c" both map to rule file language-c\.md/u,
  );
});

test("Split rules layout omits the rules pointer when there are no sections", () => {
  const output = layout(contextWithSections([]));

  assert.deepEqual(output.ruleFiles, []);
  assert.equal(output.instructionsFile.contents.includes("Additional Rules"), false);
  assert.equal(output.instructionsFile.contents.endsWith("You are a tester.\n"), true);
  assert.equal(output.bootstrapPrompt.includes(".claude/rules/aie"), false);
});

test("Split rules layout bootstrap prompt names the rules folder when rule files exist", () => {
  const output = layout(contextWithSections(["Coding Rules"]));

  assert.match(output.bootstrapPrompt, /Read `CLAUDE\.md` and `\.claude\/rules\/aie\/`/u);
});
