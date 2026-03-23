---
name: create-universal-skill
description: Use this skill when the user wants to create or update a shared universal skill under `content/skills/` in this repository. It creates the shared skill folder and writes a concise `SKILL.md` aligned with this repo's shared skill conventions.
---

# Create Universal Skill

Use this skill when the user wants a new shared skill under `content/skills/`.

Apply the same concise skill-writing discipline as `content/skills/create-project-skill/SKILL.md`, but target shared reusable skills instead of project-local ones.

## Outcome

- Create or update one shared skill folder under `content/skills/`.
- Keep the skill reusable across repositories.
- Write a concise `SKILL.md` with clear trigger wording and deterministic steps.

## Required input

- skill name
- what the shared skill should help with
- any shared files, folders, or commands it must use

If the name is missing, derive a short kebab-case name from the requested workflow.

## Workflow

1. Confirm the workflow is shared and belongs under `content/skills/`.
2. Create or update `content/skills/<skill-name>/SKILL.md`.
3. Use YAML frontmatter with:
   - `name`
   - `description`
4. Keep the body concise and include only:
   - when to use the skill
   - required inputs
   - deterministic workflow steps
   - exact shared paths or commands when needed
5. Do not add extra docs such as `README.md` or changelogs.
6. Rebuild with `bash bin/cli build --project-path <project-path>` so generated context picks up the new shared skill.

## Skill shape

```md
---
name: <skill-name>
description: Use this skill when <trigger condition>. It helps with <workflow>.
---

# <Title>

Use this skill when <trigger condition>.

## Outcome

- <result>

## Required input

- <input>

## Workflow

1. <step>
2. <step>
3. <step>
```

## Rules

- Prefer one skill per workflow.
- Keep the skill reusable across repositories.
- Reference exact repo paths instead of vague descriptions.
- Keep the skill short enough to read quickly during execution.
