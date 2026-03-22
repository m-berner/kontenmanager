# Views Layer

This directory contains the top-level **View Components** (Screens) of the application. Unlike atomic components or
forms, Screens are typically mapped to routes and act as the primary layout containers that orchestrate multiple
components, stores, and services.

## Role and Responsibilities

The mission of the views layer is to:

- **Layout Orchestration**: Define the structural arrangement of the UI (e.g., TitleBar, HeaderBar, FooterBar, and Main
  Content).
- **Route Handling**: Serve as the entry points for the Vue Router.
- **Initialization**: Manage the high-level initialization of the application and specific views (e.g., fetching initial
  data from IndexedDB).
- **State Integration**: Connect global Pinia stores to the UI and manage view-specific reactive states.

## Directory Structure

### 🏗️ Shell and Layout

- **`AppIndex.vue`**: The main entry point for the "App" context. It handles global app initialization (via
  `initializeApp`) and provides the main `v-app` shell with multiple `RouterView` slots (title, header, info, footer,
  and default).
- **`OptionsIndex.vue`**: The entry point for the "Options" page. It manages the settings interface using a tabbed
  layout for theme selection, service configurations, and market data preferences.
- **`TitleBar.vue`**: The persistent top navigation bar. It displays global information like the current account's
  balance, depot value, and connectivity status. It also allows switching between different managed accounts.
- **`HeaderBar.vue`**: Top navigation/action bar for view switching and primary commands.
- **`FooterBar.vue`**: Bottom navigation with help, privacy, and contact links.
- **`InfoBar.vue`**: A context-sensitive bar used in specific views (like the Company view) to display additional
  metadata or controls.

### 📄 Main Content Views

- **`HomeContent.vue`**: The primary dashboard (Dashboard). It features a comprehensive, searchable data table of all
  bookings for the active account, integrated with action menus and keyboard shortcuts.
- **`CompanyContent.vue`**: The portfolio overview. It displays a detailed table of stock holdings, integrating
  real-time market data, portfolio metrics (win/loss, 52-week range), and specific stock actions.
- **`HelpContent.vue`**: Displays localized help and onboarding information, including workflows, features, and usage
  guidance.
- **`PrivacyContent.vue`**: Renders structured, localized privacy information using a generic content card layout.

## Development Principles

1. **Smart Containers**: Screens are "smart" components. They are allowed to interact directly with Pinia stores, use
   complex composables, and call domain logic.
2. **Asynchronous Lifecycle**: Initialization logic (like `onBeforeMount`) should handle loading states gracefully,
   typically using the `isInitialized` flag or `isLoading` guards to show progress indicators.
3. **Responsive Composition**: Use Vuetify's grid system (`v-row`, `v-col`) and layout components (`v-main`,
   `v-container`) to ensure the extension remains usable across different popup and window sizes.
4. **Decoupled Business Logic**: While views orchestrate logic, they should not contain it. Move complex calculations to
   `src/domain/logic.ts` (functional `DomainLogic` module) and data transformations to the appropriate functional
   services, composables, or (for multi-step workflows) `src/app/usecases/*`.

## Testing

- Prefer testing complex logic at the store/domain level; keep view tests focused on routing and integration.
- Use the `happy-dom` environment from Vitest for basic rendering when needed.

## Caching Notes (Quotes)

There are two cache layers affecting stock quote updates:

- **HTTP response cache (fetch service)**: `src/adapters/secondary/services/fetch/http.ts` caches quote HTML responses for a short
  TTL
  (`CACHE_POLICY.QUOTE_TTL_MS`). Non-quote endpoints use `CACHE_POLICY.DEFAULT_HTTP_TTL_MS`.
- **UI page freshness (runtime store)**: `src/adapters/primary/stores/runtime.ts` tracks when a stocks table page was last loaded
  and
  `CompanyContent.vue` skips reloads while the page is still "fresh" (`CACHE_POLICY.ONLINE_RATES_MAX_AGE_MS`).

Cache invalidation triggers (important for "import then return to Company view" correctness):

- **HeaderBar: "Update quote"**: clears HTTP cache and reloads the current stocks page.
- **Backup import**: clears the runtime page-freshness cache and clears the HTTP cache.
- **Settings: provider/service change**: clears both runtime page cache and fetch-service HTTP cache.
- **Settings: active account change / stocks-per-page change**: clears runtime page cache (so the next visit reloads
  online data).
