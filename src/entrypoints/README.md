# ENTRYPOINTS Layer

This directory contains the **initialization scripts and HTML templates** for the different contexts of the
WebExtension. These files serve as the primary entry points for the browser's extension engine and are responsible for
bootstrapping the application, background processes, and user-facing pages.

## Role and Responsibilities

The mission of the entrypoints layer is to:

- **Application Bootstrapping**: Initialize Vue instances, mount plugins (Pinia, Vuetify, Router, i18n), and attach
  global error handlers.
- **Context Management**: Define the distinct environments in which the extension runs (Popup/App, Background, Options).
- **Lifecycle Orchestration**: Register listeners for extension-specific events (e.g., installation, clicking the
  extension icon).
- **DOM Anchoring**: Provide the static HTML structures where the dynamic UI is mounted.

## Directory Structure

### 📱 `app` (Main Application)

- **`app.html`**: The HTML container for the main application view.
- **`app.ts`**: The main entry point. It initializes the Vue app with all required plugins and mounts the `AppIndex`
  view. It also configures global logging for errors and warnings.

### ⚙️ `background` (Background Script)

- **`background.html`**: The background page container (standard for manifest v2/v3).
- **`background.ts`**: The persistent or event-driven background process. It handles:
    - Extension installation and update logic (`onInstalled`).
    - Icon click orchestration (opening or focusing the extension tab).
    - Browser storage initialization.

### 🛠️ `options` (Options Page)

- **`options.html`**: The HTML container for the extension's settings page.
- **`options.ts`**: Bootstraps the options interface. It mounts the `OptionsIndex` view and initializes a subset of
  plugins (Vuetify, i18n, Pinia) required for the settings UI.

## Development Principles

1. **Keep it Lean**: Entry points should only handle setup and mounting. Move business logic to `services` or `domain`
   and UI layout to `views`.
2. **Global Error Handling**: Always register `app.config.errorHandler` to capture and log unhandled exceptions in a way
   that is visible in the extension's console.
3. **Plugin Consistency**: Ensure that all contexts (app and options) share the same plugin configurations (like i18n
   and Vuetify) to maintain a consistent look and feel.
4. **Lifecycle Hooks**: Use the background script to manage long-lived state or cross-tab orchestration that doesn't
   belong to a specific UI instance.

## Build Inputs Mapping

The Vite configuration defines explicit Rollup inputs for these HTML entry files:

- `src/entrypoints/background.html`
- `src/entrypoints/app.html`
- `src/entrypoints/options.html`

Keep file names stable or update `vite.config.js` accordingly when adding new entry points.
