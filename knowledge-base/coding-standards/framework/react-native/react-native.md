# React Native Standards

## Purpose

Framework-specific standards for React Native applications.

## Rules

- Keep screens focused on orchestration and move reusable logic into hooks or
  services.
- Isolate platform-specific branches behind small adapters or components.
- Treat network, storage, and permission boundaries as failure-prone paths.
- Keep navigation contracts explicit and typed.
- Use TypeScript strict mode.
- Compose application-wide concerns through root providers for configuration,
  auth, logging, API client, query state, notifications, location, and similar
  cross-cutting concerns.
- Keep server-state fetching and invalidation behind dedicated hooks or query
  abstractions.
- Separate secure storage for secrets from cache storage for offline and local
  data.
- Initialize telemetry and crash reporting conditionally by environment and
  fail fast on invalid production-like configuration.
- Treat environment selection and environment-specific app configuration as
  explicit runtime inputs.
- Handle upload, media, and network timeouts explicitly.
- Distinguish OTA-safe changes from changes that require a native rebuild.

## Preferred Patterns

- Functional components and hooks.
- Thin UI components over typed state and domain actions.
- Explicit loading, empty, and error states for async views.
- Provider composition at the app root.
- React Query or equivalent for server state and cache invalidation.
- Dedicated service modules for API access and platform integrations.
- Dedicated components for complex media behavior.
- Reusable theme modules for colors, typography, spacing, and shared styles.
- Cached read models for degraded or offline usage where the product needs it.

## Forbidden Patterns

- Business logic embedded directly in screen components.
- Unbounded global state for local screen concerns.
- Implicit navigation params without typed contracts.
- Mixing secure secrets and general cache storage in the same persistence
  mechanism.
- Scattering network access and storage access directly across screens.
- Silent production telemetry misconfiguration.
