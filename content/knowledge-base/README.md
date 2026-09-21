# Knowledge Base

The knowledge-base contains shared engineering knowledge only.

```text
content/knowledge-base/
  engineering-principles/
    universal/
      1-engineering-principles.md
      2-architecture-principles.md
  coding-rules/
    universal/
      1-coding-rules.md
      2-testing-standards.md
      critical-rules.md
    language/
    application-type/
      api.md
      cli.md
    framework/
      react-native.md
    conditional/
```

- `engineering-principles/universal/` contains shared engineering principles and architecture principles.
- `coding-rules/universal/` contains shared coding rules and testing standards.
- `coding-rules/language/` contains language-specific rules.
- `coding-rules/application-type/*.md` contains one directly selectable app type per file.
- `coding-rules/framework/*.md` contains one directly selectable framework per file.
- Application-type and framework selection names are Markdown filenames without `.md`. Nested selection folders are not supported.
- `coding-rules/conditional/` contains optional advanced rules that apply only when multiple selected dimensions match. Nested folders are allowed.
- `critical-rules.md` is the only special filename. Any matched `critical-rules.md` is lifted into the top `Critical Rules` section of the final context.
- All other markdown files are appended normally under section labels derived from their folders.
- Files are ordered alphabetically within a folder. Use a numeric `N-` prefix to make the order explicit.
- When one section label matches several files, the first file renders as the section body and every later file gets its own sub-heading derived from its filename.
- Do not use `#` or `##` headings inside content files. Start at `###` when a file needs internal structure.
