# Conditional Coding Rules

This folder is optional.

Use it only for rules that apply when multiple selected dimensions match together, for example:

- language + application type
- language + framework
- application type + framework

Each file in this folder must declare `applies_to` frontmatter.

Example:

```md
---
applies_to:
  languages: [csharp]
  application_types: [api]
---
```

Matching rules:

- different dimensions use `AND`
- multiple values in one dimension use `OR`
- missing or empty `applies_to` means the file applies nowhere

E.g., the following rules file would apply to APIs in both `csharp` and `typescript`
```md
---
applies_to:
  languages: [csharp, typescript]
  application_types: [api]
---
```
