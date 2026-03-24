---
applies_to:
  languages: [csharp]
  application_types: [api]
---
- For new C# APIs, prefer FastEndpoints with minimal API style rather than MVC controllers.
- If a project is already established on a different API pattern, continue with the current project pattern instead of forcing a framework migration.
- Keep API startup minimal and move configuration, service registration, and HTTP pipeline setup into explicit composition-root modules.
- Validate required environment and app settings at startup and fail fast when they are missing.
- Use one global boundary mechanism for translating unhandled exceptions into standardized API error responses.
- Keep production error payloads safe. Include detailed diagnostics only in development or explicitly protected environments.
- Make health endpoints simple, reliable, and externally checkable.
- Verify dependency injection registrations and endpoint construction with automated tests where the stack exposes those entry points.
- Prefer strongly typed configuration bound from environment-aware settings.
- Prefer dependency injection through explicit composition roots.
- Prefer integration tests for auth, repositories, health, storage, and critical endpoint flows.
- Do not scatter service registration and HTTP pipeline configuration across the codebase.
- Do not mix business logic into transport handlers because framework hooks make it convenient.
