# Knowledge Base

The knowledge-base contains shared engineering knowledge only.

```text
content/knowledge-base/
  engineering-principles/
    universal/
  coding-rules/
    universal/
    language/
    application-type/
    framework/
    conditional/
```

- `engineering-principles/universal/` contains shared engineering principles.
- `coding-rules/universal/` contains shared coding rules.
- `coding-rules/language/` contains language-specific rules.
- `coding-rules/application-type/` contains app-type-specific rules.
- `coding-rules/framework/` contains framework-specific rules.
- `coding-rules/conditional/` contains optional advanced rules that apply only when multiple selected dimensions match. Nested folders are allowed.
- `critical-rules.md` is the only special filename. Any matched `critical-rules.md` is lifted into the top `Critical Rules` section of the final context.
- All other markdown files are appended normally under section labels derived from their folders.
