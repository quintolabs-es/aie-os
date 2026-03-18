# Knowledge Base

The knowledge-base contains shared engineering knowledge only.

```text
content/knowledge-base/
  engineering-principles/
    universal/
  coding-standards/
    universal/
    language/
    application-type/
    framework/
    conditional/
```

- `engineering-principles/universal/` contains shared engineering principles.
- `coding-standards/universal/` contains shared coding standards.
- `coding-standards/language/` contains language-specific standards.
- `coding-standards/application-type/` contains app-type-specific standards.
- `coding-standards/framework/` contains framework-specific standards.
- `coding-standards/conditional/` contains optional advanced standards that apply only when multiple selected dimensions match. Nested folders are allowed.
- `critical-rules.md` is the only special filename. Any matched `critical-rules.md` is lifted into the top `Critical Rules` section of the final context.
- All other markdown files are appended normally under section labels derived from their folders.
