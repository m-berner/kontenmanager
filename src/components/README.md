# Components Layer

This directory contains the user interface components of the application, built with **Vue 3** and **Vuetify 3**. The
components are organized to separate reusable UI elements from complex, stateful dialogs and forms.

## Role and Responsibilities

The mission of the components layer is to:

- **User Interaction**: Provide the visual interface for all user actions.
- **State Presentation**: Render reactive state from Pinia stores.
- **Form Handling**: Implement data entry interfaces using Vuetify components, integrated with `useForms` and
  `DomainValidators`.
- **Modality Management**: Handle complex user flows via the centralized `DialogPort` system.

## Directory Structure

### 🏗️ Base Components

General-purpose, reusable UI elements located directly in `src/components/`:

- **`AlertOverlay.vue`**: Global notification system for info, success, and error messages.
- **`DialogPort.vue`**: The central "hub" for all dialogs. Uses Vue `<Teleport>` to render dynamic components based on
  the `runtime` store state.
- **`ContentCard.vue`**: A standardized wrapper for main screen content.
- **`ThemeSelector.vue` / `CurrencyInput.vue`**: Specialized input and configuration components.

### 💬 Dialogs (`/dialogs`)

Complex modal interfaces for CRUD operations and system actions:

- **Logic Isolation**: Dialogs handle the "Save" or "Action" flow, coordinating with `useDialogGuards` to manage loading
  states and connection checks.
- **Atomic Operations**: Each dialog (e.g., `AddAccount.vue`, `ExportDatabase.vue`) is responsible for its own
  success/error notifications and store updates.

### 📝 Forms (`/dialogs/forms`)

The inner building blocks of dialogs:

- **Separation of Concerns**: Forms contain the actual input fields (`v-text-field`, etc.) but usually do not contain
  the submission logic.
- **Shared Schemas**: Forms are often reused between "Add" and "Update" variants of a dialog.

## Architectural Patterns

### 🔮 The Dialog Hub (`DialogPort`)

Instead of nesting multiple `<v-dialog>` components throughout the app, the project uses a single entry point:

1. Components request a dialog by setting the `dialogName` in the `runtime` store.
2. `DialogPort.vue` (teleported to `<body>`) dynamically renders the requested component.
3. This ensures a clean DOM structure and consistent modal behavior.

### ⚙️ Configuration (`components.ts`)

Centralized constants for the component layer, including:

- Dialog identifiers.
- Default URLs and icons.
- UI-specific enums (e.g., list types).

## Development Principles

1. **Dumb Forms, Smart Dialogs**: Keep form components focused on presentation and validation rules. Move the
   orchestration of database calls and store updates to the parent dialog.
2. **Vuetify Best Practices**: Use standard Vuetify components and slots to maintain a consistent Look & Feel.
3. **Ref-based Validation**: Always use `v-form` with a `ref` and `validate-on="submit"` to ensure predictable
   validation behavior.
4. **Loading States**: Use `isLoading` from `useDialogGuards` to disable buttons and show progress indicators during
   asynchronous operations.
5. **Clean Setup**: Log component initialization via `DomainUtils.log` for easier debugging in the extension's console.

## Testing

- Prefer unit tests at the store/domain level for complex logic; component tests should focus on rendering and dialog
  flows.
- Use `happy-dom` (configured in Vitest) for lightweight DOM emulation.
