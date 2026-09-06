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
- **Auto-detection**: Integrates with `browserAdapter` to detect the user's preferred language.

### 🍍 State Management (`pinia.ts`)

Initializes [Pinia](https://pinia.vuejs.org/), the centralized state management library used to synchronize data between
components and handle complex application states.

This is also where store dependencies are wired (services are injected into stores via `attachStoreDeps` rather than
imported directly).

### 🚦 Routing (`router.ts`)

Configures [Vue Router](https://router.vuejs.org/) using hash history (ideal for WebExtensions).

- **Routes**: Maps URLs to screen components (Home, Company details, Privacy).
- **Named Views**: Utilizes named views to manage layout components like `TitleBar`, `HeaderBar`, and `FooterBar`.

### 🌗 Theme Sync (`themeSync.ts`)

Keeps Vuetify's active theme in sync with the persisted `settings.skin` value out of any component.

- Runs in a detached Vue `effectScope` so it can be started from entrypoints without a root component hook.
- Watches `settings.skin` reactively (with `immediate: true`) and writes changes directly to
  `vuetify.theme.global.name`.
- Returns a cleanup function (`scope.stop()`) that callers can invoke to tear down the watcher.

### 💱 Currency Sync (`currencySync.ts`)

Keeps `vue-i18n`'s `currency`/`currency3` number formats pointed at the currency the figures on
screen are actually in, the same detached-`effectScope` shape as Theme Sync above.

- Currency is an explicit, account-scoped property (`resolveDisplayCurrency`), not derived from
  the UI locale — `plugins/i18n.ts` used to bake EUR into `de-DE` and USD into `en-US`, which
  rescaled amounts to match the wrong label on a non-matching locale/account pairing.
- Watches `resolveDisplayCurrency(accounts.items, settings.activeAccountId, settings.currency)`
  and calls `i18n.global.mergeNumberFormat` for **every** configured locale (not just the active
  one), since `fallbackLocale` can still resolve formatting through the other block.
- `currencyUSD` (a third format declared in `i18n.ts`) is deliberately left untouched — it always
  means "format as USD" for USD-quoted commodity prices, independent of the display currency.
- Returns a cleanup function (`scope.stop()`), exactly like Theme Sync.

### 🧩 Global Components (`components.ts`)

A custom plugin that registers dialog components globally. This enables the **Dialog Hub** pattern (via
`DialogPort.vue`), allowing modals to be triggered dynamically by name from the `useRuntimeStore` store
(`@/adapters/ui/stores/runtime`).

## Development Principles

1. **Isolation**: Plugin configurations should be kept clean. Avoid putting business logic here; use the `domain` or
   `services` layers instead.
2. **Type Safety**: Prefer narrowed, purpose-named types over passing the whole DI surface — e.g. `pinia.ts`
   declares `PiniaAdapters = Pick<AdaptersInternal, "storageAdapter" | "alertAdapter">` for exactly what
   `createAppPinia` needs, the same pattern `SettingsStoreDeps` and `RecordsPort` use elsewhere in the app.
3. **Semantic Icons**: When adding new icons to `vuetify.ts`, always use the `aliases` object to provide a descriptive
   name rather than using MDI constants directly in components.
4. **Consistency**: Ensure that date and number formats in `i18n.ts` align with the domain rules defined in
   `src/domain/constants.ts` and the domain-level validation/formatting helpers.

## Testing

- Plugin files themselves are thin; prefer testing behavior where they are used (components/views).
- For i18n-dependent tests, set the locale explicitly and assert on formatted output rather than raw numbers/dates.

## Directory Structure

### Files

- `components.ts`: (default)
- `currencySync.ts`: startCurrencySync
- `i18n.ts`: createI18nPlugin, I18nPlugin
- `pinia.ts`: PiniaAdapters, createAppPinia
- `router.ts`: (default)
- `themeSync.ts`: startThemeSync
- `vuetify.ts`: vuetify, (default)

