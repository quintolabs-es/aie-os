# CSharp Standards

## Purpose

Language and runtime standards for .NET and C# codebases.

## Rules

- Enable nullable reference types and address warnings intentionally.
- Pass `CancellationToken` through async flows that can be cancelled.
- Keep domain logic out of controllers and infrastructure layers.
- Keep dependency registration explicit and close to composition roots.
- Read and validate required environment variables and bound settings during
  startup.
- Keep `Program.cs` minimal and move setup into extension methods or equivalent
  composition-root modules.
- Use constructor injection for controllers, endpoints, and services.
- Use explicit service lifetimes and choose `Singleton`, `Scoped`, or
  `Transient` intentionally.
- Keep authentication and authorization wiring centralized.
- Prefer async APIs end to end for request, repository, and infrastructure
  flows.
- Use typed custom exceptions and one global boundary mechanism to map them to
  HTTP responses when building APIs.
- Keep infrastructure adapters behind interfaces when replacement is expected.
- Keep strongly typed configuration models as the source of truth for runtime
  settings.
- Add automated tests that validate DI construction for application entry
  points.

## Preferred Patterns

- Dependency injection through constructors.
- Small application services with explicit command or query responsibilities.
- Structured logging with contextual properties.
- Extension methods for startup configuration, service registration, and
  request pipeline setup.
- Scoped services for request-bound dependencies and repositories.
- Health and operational endpoints that are simple and externally checkable.
- Integration and boundary tests for auth, repositories, and configuration.

## Forbidden Patterns

- Blocking on async code with `.Result` or `.Wait()`.
- Static mutable state for request or user-specific data.
- Catch-all exception handlers that hide the original failure.
- Large `Program.cs` files that mix startup orchestration with detailed wiring.
- Hidden or implicit configuration defaults for critical runtime settings.
- Registering dependencies without tests or validation for constructibility.
