# Kontenmanager

A modern web extension for private account management and stock portfolio tracking.

## Overview

Kontenmanager is a powerful browser extension (primarily targeting Firefox) designed to help users manage their private accounts and investments. It provides a sophisticated user interface for tracking financial records, managing companies/accounts, and viewing detailed accounting and dividend analytics.

Key features include:
- **Multi-Account Management:** Track different bank accounts or portfolios separately.
- **Stock Portfolio Tracking:** Real-time market data integration (via external services).
- **Accounting Tools:** Automated calculation of balances, taxes, and fees.
- **Data Privacy:** All data is stored locally in your browser using IndexedDB.
- **Data Portability:** Robust JSON-based import and export system for backups.

## Stack

- **Language:** [TypeScript](https://www.typescriptlang.org/) (Strictly typed)
- **Framework:** [Vue 3](https://vuejs.org/) (Composition API)
- **UI Component Framework:** [Vuetify 3](https://vuetifyjs.com/) (Material Design)
- **State Management:** [Pinia](https://pinia.vuejs.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Database:** [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) (via `databaseService`)
- **Package Manager:** [npm](https://www.npmjs.com/) (v11.3.x)

## Requirements

- **Node.js:** v24.0.0 or later
- **Package Manager:** npm v11.3.0 or later

## Setup & Run Commands

### Installation

```powershell
npm install
```

### Build

To build the extension for production:

```powershell
npm run build
```

The build process involves:
1. Type checking with `tsc`.
2. Vue template type checking with `vue-tsc`.
3. Bundling and optimization with `vite`.

The production-ready extension will be generated in the `kontenmanager@gmx.de/` directory.

### Development

Currently, use `npm run build` to update the extension files. The project is optimized for a fast build-and-reload workflow in Firefox.

## Project Structure

The project follows a modular architecture with a clear separation of concerns:

- `src/`: Core source code.
  - `assets/`: Static assets (icons, images).
  - `components/`: Reusable UI components, specialized dialogs, and form fragments.
  - [**`composables/`**](src/composables/README.md): Vue composition functions bridging UI and logic (APIs, Storage, DB).
  - [**`domains/`**](src/domains/README.md): The "Brain" — pure business logic, financial calculations, and validation rules.
  - `services/`: Business logic orchestration and API/DB connectivity.
  - `stores/`: Pinia state management (Records, Settings, Runtime, Alerts).
  - `views/`: Main screen layouts and entry point components.
  - `config/`: Centralized configuration (Storage keys, Entry points, DB schema).
  - [**`plugins/`**](src/plugins/README.md): Vue plugin configurations (Vuetify, i18n, Router).
  - `entrypoints/`: HTML/TS entry points for the extension (App, Background, Options).
- `kontenmanager@gmx.de/`: The built extension package.
- `releases/`: Packaged `.xpi` files for distribution.

## Architecture & Data Flow

1. **User Interaction:** Vue components in `views/` or `components/` capture user input.
2. **State Management:** Components interact with **Pinia Stores** (`src/stores/`).
3. **Business Logic:** Stores delegate complex logic to the **Domain Layer** (`src/domains/`) to ensure consistent calculations.
4. **Persistence:** Data is persisted via **Services** (`src/services/`) to **IndexedDB** or **Browser Storage** (`useStorage`).
5. **Browser Integration:** Interactions with the WebExtension API are abstracted through dedicated **Composables** (`src/composables/useBrowser`).

## Tests

The project uses [Vitest](https://vitest.dev/) for unit testing, focusing on domain logic and store state.

To run the tests:

```powershell
npm test
```

## Developer Information

- [MDN WebExtensions Documentation](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- [Vue 3 Documentation](https://vuejs.org/guide/introduction.html)
- [Vuetify 3 Documentation](https://vuetifyjs.com/en/introduction/why-vuetify/)

## License

This project is licensed under the **Mozilla Public License 2.0**. See the [LICENSE](LICENSE) file for details.