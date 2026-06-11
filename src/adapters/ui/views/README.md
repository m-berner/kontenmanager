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

### Files

- `AppIndex.vue`
- `CompanyContent.vue`
- `FooterBar.vue`
- `HeaderBar.vue`
- `HelpContent.vue`
- `HomeContent.vue`
- `InfoBar.vue`
- `OptionsIndex.vue`
- `PrivacyContent.vue`
- `TitleBar.vue`

