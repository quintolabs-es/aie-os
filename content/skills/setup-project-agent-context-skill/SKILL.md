---
name: setup-project-agent-context-skill
description: Use this skill when the user wants to set up AIE OS, configure agent context, or generate agent instruction files such as AGENTS.md or CLAUDE.md for a project. It gathers missing configuration, runs the AIE OS CLI, and verifies the generated artifacts, including installed skills.
---

# Set Up Project Agent Context

Use this skill when the user wants to configure or generate agent context for a project.

## Outcome

- Configure the target project with AIE OS when needed.
- Generate the agent instructions file for each selected tool (`CLAUDE.md` for `claude`, `AGENTS.md` for `codex`) and install the persona skills through the AIE OS CLI.
- Verify the configuration, canonical context, instructions files, and installed skills and commands.

## Required Input

- target project path
- AIE OS version tag to pin, defaulting to `v0.1.0`
- explicit user-selected configuration choices gathered through a conversational flow for all CLI parameters that will be passed to AIE OS

## Workflow

1. Inspect the target project and the available AIE OS content. Bundled content is not on disk in the target project: read it from `https://github.com/quintolabs-es/aie-os/tree/<tag>/content` (personas under `agent/persona/`, languages, application types, and frameworks under `knowledge-base/coding-rules/`). Read the project's own content folders when the user chooses them. Use this evidence only to detect existing values and valid alternatives.
2. Ask for configuration through a conversational sequence, not by presenting a prebuilt command for approval.
3. Ask one short decision at a time unless grouping closely related choices is clearer. For example:
   - ask whether to use the content shipped with AIE OS (`bundled`, the default) or the project's own knowledge-base, agent, and skills folders, and ask for those paths only when the project's own content is chosen;
   - ask which persona to use and require exactly one valid persona name;
   - ask which languages apply and require `none`, one valid language name, or multiple valid language names;
   - ask which application types apply and require `none`, one valid application-type name, or multiple valid application-type names;
   - ask which frameworks apply and require `none`, one valid framework name, or multiple valid framework names;
   - ask which tools to build for and require one or more of: `claude`, `codex`. Mention that `claude` writes `CLAUDE.md`, rule files in `.claude/rules/aie/`, `.claude/skills/`, and `/aie:<skill>` commands, and `codex` writes `AGENTS.md` and `.agents/skills/`;
   - read the chosen persona's frontmatter. If it declares `skills: [...]`, the skills path must not be empty and must contain every listed skill folder;
   - ask for the target project path when it is not obvious.
4. Every question for a selectable value must list the exact valid response values in the question itself. Phrase it conversationally while keeping the answer space closed. Example: `Which languages will this project use? Answer with none, one, or more than one of: typescript, csharp.`
5. For selectable values, show only valid alternatives discovered from the available AIE OS content. Add a concise recommendation when useful, but clearly label it as a recommendation and never treat it as selected.
6. Accept only answers that unambiguously match the listed values. Ask a follow-up if the answer is ambiguous, unsupported, incomplete, or uses a synonym that cannot be mapped with certainty.
7. After the conversational questions are complete, summarize the selected values in plain language and ask for explicit approval to continue.
8. Do not run `init` or `build` until the user explicitly approves the summarized selections.
9. Confirm `node` (20 or later), `npx`, and `git` are available.
10. If `.aie-os/aie-os.json` does not exist, run `npx --yes github:quintolabs-es/aie-os#<tag> init` from the target project. Append the approved `--agent-persona`, `--tool`, and any approved `--kb-path`, `--agent-path`, `--skills-path`, `--languages`, `--application-type`, or `--frameworks` options. Omit the content paths to use `bundled`.
11. If `.aie-os/aie-os.json` exists, preserve it and skip initialization unless the user explicitly requests reconfiguration.
12. Run `npx --yes github:quintolabs-es/aie-os#<tag> build` from the target project, with the same tag used for `init`. If the build refuses or skips a file because it was not generated or installed by AIE OS, report it and ask before re-running with `--force-overwrite`.
13. Verify `.aie-os/aie-os.json`, `.aie-os/build/effective-context.json`, `.aie-os/build/installed-artifacts.json`, a non-empty instructions file per selected tool, the rule files in `.claude/rules/aie/` for `claude`, and the installed skills (`.claude/skills/` for `claude`, `.agents/skills/` for `codex`).
14. Report the generated artifact paths, any skipped files from the build warnings, and the bootstrap prompt that `build` prints. Tell the user to start a new agent session so the installed skills and commands are picked up. If the CLI failed, report the error that prevented completion.

## Rules

- Treat AIE OS as the source of truth and generation engine.
- Do not write, patch, or reconstruct the instructions files, rule files, installed skills or commands, `.aie-os/build/effective-context.json`, or `.aie-os/build/installed-artifacts.json` directly.
- Do not duplicate AIE OS configuration or rendering logic in the skill.
- Do not overwrite an existing AIE OS configuration without explicit user approval.
- Do not assume configuration values. Always gather selections conversationally and obtain explicit approval before execution.
- Do not ask the user to validate a fully formed command as a substitute for parameter discovery.
- Do not ask open-ended questions for selectable parameters. The question must include the allowed values and the expected cardinality: `none`, exactly one, or one or more.
- Recommendations are allowed, but they must be confirmed by the user as selections before use.
- Use only values supported by the available AIE OS content.
- Stop on CLI failure and report the failing command and error instead of applying a manual workaround.
- Keep questions, alternatives, recommendations, and status messages concise.
