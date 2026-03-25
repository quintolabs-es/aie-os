const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const { planInitManifest } = require(path.join(
  __dirname,
  "..",
  "dist",
  "commands",
  "planInitManifest.js",
));

test("Init manifest planner builds the aie-os.json model from in-memory input", () => {
  const manifest = planInitManifest({
    defaults: {
      agentPath: "aie-os/content/agent",
      kbPath: "aie-os/content/knowledge-base",
      skillsPath: "aie-os/content/skills",
    },
    mode: "explicit",
    paths: {
      agentPath: "content/agent",
      kbPath: "content/knowledge-base",
      skillsPath: "",
    },
    selections: {
      applicationTypes: [],
      frameworks: [],
      languages: [],
      persona: "software-developer",
    },
  });

  assert.deepEqual(manifest, {
    version: "0.1",
    paths: {
      agent: "content/agent",
      knowledgeBase: "content/knowledge-base",
      projectCodingRules: ".aie-os/project-coding-rules",
      projectSkills: ".aie-os/project-skills",
      skills: "",
    },
    selection: {
      applicationTypes: [],
      frameworks: [],
      languages: [],
      persona: "software-developer",
    },
  });
});

test("Init manifest planner keeps an explicitly empty knowledge-base path", () => {
  const manifest = planInitManifest({
    defaults: {
      agentPath: "aie-os/content/agent",
      kbPath: "aie-os/content/knowledge-base",
      skillsPath: "aie-os/content/skills",
    },
    mode: "explicit",
    paths: {
      agentPath: "content/agent",
      kbPath: "",
      skillsPath: "",
    },
    selections: {
      applicationTypes: [],
      frameworks: [],
      languages: [],
      persona: "software-developer",
    },
  });

  assert.equal(manifest.paths.knowledgeBase, "");
});
