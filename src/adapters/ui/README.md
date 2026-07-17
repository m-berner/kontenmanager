# Ui (`src/adapters/ui/`)

This directory contains the user interface components and related logic for the extension. It follows the primary adapter pattern, providing the bridge between the user and the application's core logic.

The UI is built with **Vue 3** and **Vuetify**, using **Pinia** for state management.

## Key Responsibilities

- **Rendering**: Displaying financial data, forms, and charts to the user.
- **User Interaction**: Handling input, navigation, and feedback.
- **State Management**: Managing local and global UI state.
- **Localization**: Providing multi-language support.

## Subdirectories

- `components/`: Reusable UI building blocks (buttons, cards, dialogs).
- `views/`: Top-level page components (Dashboard, Accounts, Bookings).
- `stores/`: Pinia stores for reactive state management.
- `composables/`: Reusable Vue composition functions.
- `entrypoints/`: Extension entry points (Popup, Options, Background).
- `_locales/`: i18n translation files.

## Directory Structure

### Directories

- `assets/`
- `components/`
- `composables/`
- `entrypoints/`
- `plugins/`
- `stores/`
- `views/`
- `_locales/`

### Files

- `style.css`
- `validationAdapter.ts`: createRule, cleanString, oneOfTwo, required, stringLength, createValidationAdapter, ...

