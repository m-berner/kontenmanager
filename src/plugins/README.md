# Plugins Layer

This directory contains the **Vue Plugins** configuration. These plugins extend the Vue application with core
functionalities such as UI components, state management, routing, and internationalization.

## Role and Responsibilities

The mission of the plugins layer is to:

- **Framework Extension**: Initialize and configure external libraries (Vuetify, Pinia, Vue Router, Vue I18n) for use
  within the Vue application.
- **Global Registration**: Register global components and directives that are used throughout the extension.
- **Theme and Styling**: Define the visual identity of the application via Vuetify themes and icon sets.
- **Localization**: Configure the internationalization engine with supported locales and formatting rules.

## Plugin Overview

### 🎨 Vuetify (`vuetify.ts`)

Configures the [Vuetify 3](https://vuetifyjs.com/) UI framework.

- **Themes**: Defines multiple custom color themes (Ocean, Sky, Earth, Meadow, Light, Dark).
- **Icons**: Sets up the Material Design Icons (MDI) SVG icon set and defines custom aliases for semantic icon usage
  across the app.

### 🌐 Internationalization (`i18n.ts`)

Configures [Vue I18n](https://vue-i18n.intlify.dev/) for multi-language support.

- **Locales**: Supports German (`de-DE`) and English (`en-US`).
- **Formatting**: Defines locale-specific rules for date, time, and currency (including high-precision currency
  formats).
- **Auto-detection**: Integrates with `useBrowser` to detect the user's preferred language.

### 🍍 State Management (`pinia.ts`)

Initializes [Pinia](https://pinia.vuejs.org/), the centralized state management library used to synchronize data between
components and handle complex application states.

### 🚦 Routing (`router.ts`)

Configures [Vue Router](https://router.vuejs.org/) using hash history (ideal for WebExtensions).

- **Routes**: Maps URLs to screen components (Home, Company details, Privacy).
- **Named Views**: Utilizes named views to manage layout components like `TitleBar`, `HeaderBar`, and `FooterBar`.

### 🧩 Global Components (`components.ts`)

A custom plugin that registers dialog components globally. This enables the **Dialog Hub** pattern (via
`DialogPort.vue`), allowing modals to be triggered dynamically by name from the `RuntimeStore`.

## Development Principles

1. **Isolation**: Plugin configurations should be kept clean. Avoid putting business logic here; use the `domain` or
   `services` layers instead.
2. **Type Safety**: Use the standardized interfaces (e.g., `I_Vuetify`, `I_Router`) defined in `@/types` for
   configuration exports.
3. **Semantic Icons**: When adding new icons to `vuetify.ts`, always use the `aliases` object to provide a descriptive
   name rather than using MDI constants directly in components.
4. **Consistency**: Ensure that date and number formats in `i18n.ts` align with the domain rules defined in
   `src/domains/config`.

## Testing

- Plugin files themselves are thin; prefer testing behavior where they are used (components/views).
- For i18n-dependent tests, set the locale explicitly and assert on formatted output rather than raw numbers/dates.
