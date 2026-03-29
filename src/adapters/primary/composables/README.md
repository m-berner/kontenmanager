# Composables Layer

This folder contains Vue composables that coordinate UI workflows and connect UI components to stores and services.
Composables orchestrate behavior; they should not contain domain-heavy business rules.

## Purpose

Composables in this project are responsible for:

- Converting service calls into reactive UI-facing state.
- Coordinating store updates with service operations (and guarding long-running dialog flows).
- Managing form state and mapping between view models and domain/database models.
- Providing typed convenience access to DI-provided adapters and repositories (`useAdapters`, `useRepositories`).

## File Overview

### Persistence and Data Access

- `useRepositories.ts`: Typed access to DI-provided repositories (`useAdapters().repositories`).

### Forms and Dialogs

- `useForms.ts`: Form managers for initialization and reset. Delegates data mapping to
  `src/domain/mapping/formMapper.ts`.
- `useDialogGuards.ts`: Guard logic for dialog flows (validation, loading, reconnection checks).

### Integration Helpers

- `useFavicon.ts`: Reactive favicon loading interface. Delegates fetch logic to
  `src/adapters/secondary/faviconAdapter.ts`.
- `useUrl.ts`: Reactive URL parsing interface. Delegates parsing logic to `src/domain/utils/url.ts`.

### UI Interaction

- `useMenu.ts`: Menu action execution and temporary row highlighting for table interactions.
- `useKeyboardShortcuts.ts`: Registration and cleanup of global keyboard shortcuts.

## Conventions

1. Keep domain/business rules in `src/domain/*`; composables orchestrate, they do not own core business logic.
2. Prefer moving multistep workflows into `src/app/usecases/*` (dialogs/views call usecases; composables stay
   UI-focused).
3. Prefer structured error propagation (`AppError` or domain-specific errors), then map errors to user feedback.
4. Prefer `alertAdapter` (via components/dialogs) for foreground feedback; use system notifications only when
   background visibility is required.
5. Always clean up effects (`onUnmounted`): listeners, timers, intervals, and subscriptions.
6. Route persistence writes through domain validation before `add`/`update`.

## Testing Guidance

- Test pure helper logic without the Vue runtime whenever possible.
- Stub browser globals for composables that depend on WebExtension APIs.
- Verify mapping/normalization behavior in `useForms` to protect DB contract stability.
- Assert cleanup behavior for composables that register listeners or timers.
