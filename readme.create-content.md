
### Create content

AIE OS builds context from three shared sources plus two project-local sources:

- knowledge base root (`--kb-path`)
  - mandatory structure:
    - `[kb-path]/engineering-principles/universal/*.md`
    - `[kb-path]/coding-standards/universal/*.md`
    - `[kb-path]/coding-standards/language/<name>/*.md`
    - `[kb-path]/coding-standards/application-type/<name>/*.md`
    - `[kb-path]/coding-standards/framework/<name>/*.md`
  - purpose:
    - engineering principles and coding standards shared across projects
  - examples:
    - `[kb-path]/engineering-principles/universal/engineering-principles.md`
    - `[kb-path]/coding-standards/universal/coding-standards.md`

- agent root (`--agent-path`)
  - mandatory structure:
    - `[agent-path]/persona/*.md`
    - `[agent-path]/style/*.md`
  - purpose:
    - agent behavior configuration

- skills root (`--skills-path`)
  - mandatory structure:
    - `[skills-path]/<skill-name>/`
  - purpose:
    - shared reusable workflows

- project-local sources in the target project
  - mandatory structure:
    - `.aie-os/project-coding-standards/*.md`
    - `.aie-os/project-skills/<skill-name>/`
  - purpose:
    - project-specific overrides and additions

Rules:
- `<name>` folder names under `language/`, `application-type/`, and `framework/` are the option names discovered by `init`. Make them legible, e.g., `language/csharp/*.md`, `application-type/console/*.md`, etc.
- Skills should follow the Agent Skills packaging specification: https://agentskills.io/specification
- AIE OS integrates skills by folder and does not validate skill internals beyond discovering the skill directory.
- Add concise markdown files only. `README.md` is descriptive and ignored by `build`.
- Project-specific coding standards and skills may override shared ones.
- Shared engineering principles do not have a project-specific override layer.

### Content authoring guidance

- Keep context small. The final effective context must fit comfortably inside agent context windows and still leave room for the task, chat history, and repository code.
- Prefer many short focused files over a few large files.
- Recommended size:
  - one file should usually stay under 150-300 lines
  - a shared file should usually stay under 1-2 KB of dense text unless it is clearly justified
  - if one topic grows too much, split it by concern
- Write these files as operational instructions, not as conversational prompts.
- Good content is:
  - explicit
  - directive
  - reusable across tasks
  - easy to scan
- Prefer:
  - short rules
  - bullet lists
  - clear constraints
  - concrete preferred and forbidden patterns
  - small examples only when they clarify the rule
- Avoid:
  - long narrative explanations
  - motivational language
  - duplicated rules across files
  - vague advice such as "follow best practices"
  - tool-specific wording unless the file is intentionally tool-specific
- Good prompting practices still apply:
  - be specific
  - remove ambiguity
  - state the desired behavior directly
  - separate general rules from task workflows
  - prefer deterministic wording over soft suggestions

### Recommended file structure

Use a small fixed set of section headers. Add bullet points under the appropriate header.

- `## Purpose`
  - optional
  - for maintainers only
  - not included in the final agent-facing context
- `## Critical Rules`
  - optional
  - use only for rules that must surface first in the final agent context
- `## Rules`
  - default section
  - use this when classification is unclear
- `## Preferred Patterns`
  - optional
  - use for positive implementation guidance
- `## Forbidden Patterns`
  - optional
  - use for anti-patterns and hard constraints
- `## Examples`
  - optional
  - low-priority illustrative material only

All sections are optional. The builder should use only the sections present in the file.

### Template

```md
# <Title>

## Purpose

This section is not included in the final agent-facing context.

## Rules

- 

## Preferred Patterns

- 

## Forbidden Patterns

- 
```

Use this variant only when a file contains rules that must surface first:

```md
# <Title>

## Purpose

This section is not included in the final agent-facing context.

## Critical Rules

- 

## Rules

- 
```
