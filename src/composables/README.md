# Composables Layer

This folder contains Vue composables that coordinate UI workflows and connect UI components to stores and services.
Composables orchestrate behavior; they should not contain domain-heavy business rules.

## Purpose

Composables in this project are responsible for:

- Converting service calls into reactive UI-facing state.
- Coordinating store updates with service operations (and guarding long-running dialog flows).
- Managing form state and mapping between view models and domain/database models.
- Wrapping persistence access (`useIndexedDB`) with typed, reusable APIs.

## File Overview

### Persistence and Data Access

- `useIndexedDB.ts`: Reactive interface for IndexedDB entities. Delegates CRUD operations to
  `src/services/database/repositories.ts` and `src/services/database/service.ts`.

### Forms and Dialogs

- `useForms.ts`: Form managers for initialization and reset. Delegates data mapping to
  `src/domains/mapping/formMapper.ts`.
- `useDialogGuards.ts`: Guard logic for dialog flows (validation, loading, reconnection checks).

### Integration Helpers

- `useFavicon.ts`: Reactive favicon loading interface. Delegates fetch logic to `src/services/faviconService.ts`.
- `useDomain.ts`: Reactive URL/domain parsing interface. Delegates parsing logic to `src/domains/utils/url.ts`.

### UI Interaction

- `useMenu.ts`: Menu action execution and temporary row highlighting for table interactions.
- `useKeyboardShortcuts.ts`: Registration and cleanup of global keyboard shortcuts.

## Conventions

1. Keep domain/business rules in `src/domains/*`; composables orchestrate, they do not own core business logic.
2. Prefer structured error propagation (`AppError` or domain-specific errors), then map errors to user feedback.
3. Prefer `alertService` (via components/dialogs) for foreground feedback; use system notifications only when
   background visibility is required.
4. Always clean up sideeffects (`onUnmounted`): listeners, timers, intervals, and subscriptions.
5. Route persistence writes through domain validation before `add`/`update`.

## Testing Guidance

- Test pure helper logic without the Vue runtime whenever possible.
- Stub browser globals for composables that depend on WebExtension APIs.
- Verify mapping/normalization behavior in `useForms` to protect DB contract stability.
- Assert cleanup behavior for composables that register listeners or timers.
