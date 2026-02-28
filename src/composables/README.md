# Composables Layer

This directory contains **Vue Composables**, which serve as a bridge between the logic layer (Domain/Services) and the
user interface. In this extension, they are essential for encapsulating side effects related to browser APIs (
WebExtensions) and providing a reactive interface for Vue components.

## Role and Responsibilities

The mission of the composables is to:

- **UI/Services Bridge**: Translate calls to asynchronous services into reactive state for components.
- **Form Management**: Centralize the mapping logic between raw form data and domain objects via `useForms`.
- **Browser Abstraction**: Isolate the use of `browser.*` (or `chrome.*`) via `useBrowser` to facilitate testing and
  maintenance.
- **User Feedback Policy**: Centralize foreground user feedback via `useAlert` (`handleUserInfo`, `handleUserError`,
  `handleUserWarning`, `handleUserConfirm`) to keep formatting, defaults, and logging consistent.
- **Reactive Persistence**: Provide a simple interface for interacting with IndexedDB (`useIndexedDB`) and Browser
  Storage (`useStorage`).

## Directory Structure

### 💾 Persistence and State

- **`useIndexedDB.ts`**: Provides typed wrappers for each database store. It ensures that incoming data is validated by
  the domain before writing.
- **`useStorage.ts`**: Handles simple persistence (sync/local/session) via browser storage APIs.

### 📝 Forms and Validation

- **`useForms.ts`**: Contains `FormManagers`. They manage the initial state of forms, resetting, and mapping to database
  data structures.
- **`useDialogGuards.ts`**: Provides protection mechanisms for dialog operations (loading, Vuetify form validation, DB
  reconnection attempts).

### 🌐 Browser Integration

- **`useBrowser.ts`**: The entry point for interactions with the WebExtension API (tabs, notifications, downloads,
  i18n).
- **`useStorage.ts`**: Dedicated composable for browser local storage operations (get, set, clear, listener).
- **`useFavicon.ts`**: Utility for fetching and managing website icons with a fallback system.
- **`useDomain.ts`**: URL parsing logic to extract domains, subdomains, and protocols reactively.

### 🔔 User Feedback

- **`useAlert.ts`**: Thin composable wrapper around `alertService` for ergonomic Vue usage.
- Prefer `useAlert` in components/composables for foreground UI feedback.
- Use `useBrowser().showSystemNotification(...)` only for system-level/background notifications where OS-level visibility is needed.

### 🖱️ Interface and Interaction

- **`useMenu.ts`**: Manages contextual menu actions and row highlighting in data tables.
- **`useKeyboardShortcuts.ts`**: Centralized system for registering and managing global keyboard shortcuts within the
  extension.

## Development Principles

1. **No heavy business logic**: Complex calculations should reside in `src/domains/logic.ts`. The composable only calls
   these functions.
2. **Consistent error handling**: Use `AppError` to propagate errors in a structured manner.
3. **Alert policy**: Do not call the alert store directly from components unless strictly necessary. Prefer `useAlert`
   wrapper functions (`handleUserInfo`, `handleUserWarning`, `handleUserError`, `handleUserConfirm`) to keep
   formatting and behavior consistent.
4. **Cleanup**: Always use `onUnmounted` to remove event listeners (keyboard, storage) to avoid memory leaks.
5. **Systematic Validation**: Database composables (`useIndexedDB`) must systematically pass data through
   `DomainValidators` before any `add` or `update` operation.

## Testing

- Unit test pure helpers directly (e.g., URL/domain parsing) without Vue.
- For composables with browser API usage, stub the `browser` global (see tests stubbing `browser.storage` and
  `browser.notifications`).
- Favor testing mapping functions from `useForms` to ensure DB-bound data is normalized (e.g., booking type name
  normalization via `DomainUtils.normalizeBookingTypeName`).
