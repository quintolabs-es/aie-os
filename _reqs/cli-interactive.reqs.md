Clear. No more questions.

Updated requirements summary:

- Invocation
  - commands are mandatory: `app-cli <command>`
  - bare `app-cli` shows:
    - clear error like `You must specify a command.`
    - then help text

- `<command>`
  - accepts arguments
  - prompts only for missing required values
  - prompts only when running in a real terminal
  - if not in a real terminal and required values are missing, fail clearly
  - invalid input re-prompts

- Single-select UX
  - up/down arrows
  - Enter confirms
  - default preselected
  - blank line between question and options
  - numbered options
  - selected option shown with `>` and color `#1692d1`
  - if a single-select needs “no selection”, that can be an explicit option

- Multi-select UX
  - up/down arrows
  - space toggles `[x]` / `[ ]`
  - Enter confirms
  - no explicit `None` option
  - “none selected” means all options remain `[ ]`
  - blank line between question and options
  - numbered options
  - highlighted row shown with `>` and color `#1692d1`

- Terminal behavior
  - interactive prompts only when attached to a TTY
  - color disabled automatically when not attached to a TTY

- Cancellation
  - `Esc` and `Ctrl+C` both cancel cleanly
  - output: `<command> canceled.`

- Help UX
  - task-oriented help
  - grouped commands/options
  - concrete examples
