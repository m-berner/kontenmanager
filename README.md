# Kontenmanager

A modern WebExtension for private account management and stock portfolio tracking.

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

## Quick Start

### Installation

```powershell
npm install
```

### Build (Development package)

```powershell
npm run build
```

What this does:
- Runs TypeScript checks (`tsc`) and Vue SFC checks (`vue-tsc --noemit`).
- Bundles the extension with Vite.
- Copies static assets and creates a ready-to-load extension under `kontenmanager@gmx.de/`.
- Produces a zipped `.xpi` in `releases/` when environment variables are provided (see `vite.config.js`).

Load the folder `kontenmanager@gmx.de/` as a temporary addon in Firefox (about:debugging → This Firefox → Load Temporary Add-on... → select any file within that folder).

### Test

```powershell
npm test
```

Run in watch mode during development:

```powershell
npm run test:watch
```

### Lint i18n

```powershell
npm run i18n:lint
# Strict mode (fails on unused keys)
npm run i18n:lint:strict
```

## Project Structure

The project follows a modular architecture with a clear separation of concerns:

- `src/`: Core source code.
  - `assets/`: Static assets (icons, images).
  - `components/`: Reusable UI components, specialized dialogs, and form fragments.
  - [**`composables/`**](src/composables/README.md): Vue composition functions bridging UI and logic (APIs, Storage, DB).
  - [**`domains/`**](src/domains/README.md): The "Brain" — pure business logic, financial calculations, and validation rules.
  - `services/`: Business logic orchestration and API/DB connectivity. See [services/README.md](src/services/README.md).
  - `stores/`: Pinia state management (Records, Settings, Runtime, Alerts). See [stores/README.md](src/stores/README.md).
  - `views/`: Main screen layouts and entry point components. See [views/README.md](src/views/README.md).
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

## Development Workflow

1. Make changes in `src/`.
2. Run tests locally to validate logic:
   - Unit tests focus on domain utilities and Pinia stores.
3. Build the extension with `npm run build`.
4. Reload the temporary addon in Firefox and verify behavior in the Browser Console.

## Tests

The project uses [Vitest](https://vitest.dev/) for unit testing, focusing on domain logic and store state.

To run the tests:

```powershell
npm test
```

## Linting & Formatting

- ESLint with TypeScript and Vue rules (`eslint.config.js`).
- Prettier for formatting.
- i18n dictionaries are verified via custom scripts under `scripts/`.

## Packaging & Verification

- The Vite config supports copying built artifacts into the extension directory and optionally zipping a release.
- To verify a packaged Firefox extension, run:

```powershell
npm run verify
```

This uses Mozilla's `addons-linter` against the latest `.xpi` in `releases/`.

## Developer Information

- [MDN WebExtensions Documentation](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- [Vue 3 Documentation](https://vuejs.org/guide/introduction.html)
- [Vuetify 3 Documentation](https://vuetifyjs.com/en/introduction/why-vuetify/)

## License

This project is licensed under the **Mozilla Public License 2.0**. See the [LICENSE](LICENSE) file for details.

## Troubleshooting

- Tests cannot resolve `@/...` imports: ensure Vite alias is configured (already set in `vite.config.js`).
- DOM-related tests: use the `happy-dom` environment provided by Vitest config.
- Duplicate BookingType detection: names are normalized (trimmed, collapsed whitespace) via `DomainUtils.normalizeBookingTypeName`.