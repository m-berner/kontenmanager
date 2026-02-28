# Composables Layer

This folder contains Vue composables that coordinate UI workflows, browser APIs, and persistence access.
Composables should adapt and orchestrate behavior, not implement domain-heavy logic.

## Purpose

Composables in this project are responsible for:

- Converting service and storage calls into reactive UI-facing state.
- Encapsulating browser/WebExtension interactions behind `useBrowser`.
- Providing a consistent foreground feedback path through `useAlert`/`alertService`.
- Managing form state and mapping between view models and domain/database models.
- Wrapping persistence access (`useIndexedDB`, `useStorage`) with typed, reusable APIs.

## File Overview

### Persistence

- `useIndexedDB.ts`: Typed wrappers per IndexedDB entity/store. Validates incoming data before writes.
- `useStorage.ts`: Browser storage adapter (local/sync/session) with listener utilities.

### Forms and Dialogs

- `useForms.ts`: Form managers for initialization, reset, and mapping to persisted models.
- `useDialogGuards.ts`: Guard logic for dialog flows (validation, loading, reconnection checks).

### Browser and Integration

- `useBrowser.ts`: Main WebExtension abstraction (`tabs`, `downloads`, `notifications`, `i18n`, etc.).
- `useFavicon.ts`: Favicon loading utilities with fallback behavior.
- `useDomain.ts`: Reactive URL/domain parsing helpers.

### UI Interaction

- `useMenu.ts`: Menu action execution and temporary row highlighting for table interactions.
- `useKeyboardShortcuts.ts`: Registration and cleanup of global keyboard shortcuts.

### Alerts

- `useAlert.ts`: Vue-friendly wrapper around `alertService` for consistent foreground feedback UX.

## Conventions

1. Keep domain/business rules in `src/domains/*`; composables orchestrate, they do not own core business logic.
2. Prefer structured error propagation (`AppError` or domain-specific errors), then map errors to user feedback.
3. Use `useAlert` for foreground feedback; use system notifications only when OS-level/background visibility is required.
4. Always clean up side effects (`onUnmounted`): listeners, timers, intervals, and subscriptions.
5. Route persistence writes through domain validation before `add`/`update`.

## Testing Guidance

- Test pure helper logic without Vue runtime whenever possible.
- Stub browser globals for composables that depend on WebExtension APIs.
- Verify mapping/normalization behavior in `useForms` to protect DB contract stability.
- Assert cleanup behavior for composables that register listeners or timers.
