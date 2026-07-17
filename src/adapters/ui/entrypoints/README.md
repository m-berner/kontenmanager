# ENTRYPOINTS Layer

This directory contains the **initialization scripts and HTML templates** for the different contexts of the
WebExtension. These files serve as the primary entry points for the browser's extension engine and are responsible for
bootstrapping the application, background processes, and user-facing pages.

## Role and Responsibilities

The mission of the entrypoints layer is to:

- **Application Bootstrapping**: Initialize Vue instances, mount plugins (Pinia, Vuetify, Router, i18n), and attach
  global error handlers.
- **Context Management**: Define the distinct environments in which the extension runs (Popup/App, Background, Options).
- **DI Wiring**: Create the adapter container per context and provide it via Vue DI (`provideAdapters`).
- **Lifecycle Orchestration**: Register listeners for extension-specific events (e.g., installation, clicking the
  extension icon).
- **DOM Anchoring**: Provide the static HTML structures where the dynamic UI is mounted.

## Directory Structure

### Files

- `app.html`
- `app.ts`
- `background.html`
- `background.ts`
- `errorHandling.ts`: installUnhandledRejectionLogger, installVueGlobalHandlers
- `options.html`
- `options.ts`

