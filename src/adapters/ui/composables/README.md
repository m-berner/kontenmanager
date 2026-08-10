# Composables Layer

This folder contains Vue composables that coordinate UI workflows and connect UI components to stores and services.
Composables orchestrate behavior; they should not contain domain-heavy business rules.

## Purpose

Composables in this project are responsible for:

- Converting service calls into reactive UI-facing state.
- Coordinating store updates with service operations (and guarding long-running dialog flows).
- Managing form state and mapping between view models and domain/database models.
- Providing typed convenience access to DI-provided adapters (`useAdapters`).

Repositories are reached through `useAdapters().repositories` directly — there is
deliberately no `useRepositories` wrapper. One existed, documented here as the
intended route, but nothing ever called it: every consumer destructured
`repositories` off `useAdapters()` instead, so the documentation asserted a
convention the code did not follow.

## File Overview

### Forms and Dialogs

- `useForms.ts`: Form managers for initialization and reset. Delegates data mapping to
  `src/domain/mapping/formMapper.ts`.
- `useDialogGuards.ts`: Guard logic for dialog flows (validation, loading, reconnection checks).
- `useExportDialog.ts`: Controller for the export-database dialog (`useExportDatabaseDialogController`).
- `useImportDialog.ts`: Controller for the import-database dialog (`useImportDatabaseDialogController`), including
  rollback handling.

### Integration Helpers

- `useFavicon.ts`: Reactive favicon loading interface. Delegates fetch logic to
  `src/adapters/driven/faviconAdapter.ts`.
- `useUrl.ts`: Reactive URL parsing interface. Delegates parsing logic to `src/domain/utils/url.ts`.
- `useOnlineStockData.ts`: Online market-data loading for the portfolio view (fetching min/rate/max and date data,
  writing results back to the stocks store, cache invalidation on provider changes).

### UI Interaction

- `useMenu.ts`: Menu action execution and temporary row highlighting for table interactions.
- `useKeyboardShortcuts.ts`: Registration and cleanup of global keyboard shortcuts.
- `useHeaderBarActions.ts`: Header bar icon/action handling (dialog opening, online data refresh).
- `bookingSearch.ts`: Search configuration for `HomeContent`'s bookings table (filter keys plus the
  custom-key-filter that makes the booking-type column searchable by its displayed name). Not a `use*`
  composable — it holds no reactive state; it lives here because it is a plain module rather than a
  `.vue` screen, and because being importable is what lets it be tested against Vuetify's real filter.

## Conventions

1. Keep domain/business rules in `src/domain/*`; composables orchestrate, they do not own core business logic.
2. Prefer moving multistep workflows into `src/app/usecases/*` (dialogs/views call usecases; composables stay
   UI-focused).
3. Prefer structured error propagation (`AppError` or domain-specific errors), then map errors to user feedback.
4. Prefer `alertAdapter` (via components/dialogs) for foreground feedback; use system notifications only when background
   visibility is required.
5. Always clean up effects (`onUnmounted`): listeners, timers, intervals, and subscriptions.
6. Route persistence writes through domain validation before `add`/`update`.

## Testing Guidance

- Test pure helper logic without the Vue runtime whenever possible.
- Stub browser globals for composables that depend on WebExtension APIs.
- Verify mapping/normalization behavior in `useForms` to protect DB contract stability.
- Assert cleanup behavior for composables that register listeners or timers.

## Directory Structure

### Files

- `bookingSearch.ts`: BOOKING_SEARCH_KEYS, createBookingSearchFilter
- `useDialogGuards.ts`: useDialogGuards
- `useExportDialog.ts`: useExportDatabaseDialogController
- `useFavicon.ts`: useFavicon
- `useForms.ts`: createStockFormManager, createAccountFormManager, createBookingFormManager,
  createBookingTypeFormManager, StockFormManager, ...
- `useHeaderBarActions.ts`: useHeaderBarActions
- `useImportDialog.ts`: useImportDatabaseDialogController
- `useKeyboardShortcuts.ts`: useKeyboardShortcuts
- `useMenu.ts`: useMenuHighlight, useMenuAction
- `useOnlineStockData.ts`: useOnlineStockData
- `useUrl.ts`: useUrl

