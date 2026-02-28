# Configuration Layer

This directory contains the central configuration for the application. It acts as a single source of truth for static
values, schema definitions, and system-wide constants.

## Role and Responsibilities

The mission of the configuration layer is to:

- **Centralize Constants**: Keep all magic numbers, strings, and keys in one place.
- **Define Schemas**: Maintain the structure of the database and views.
- **Standardize Defaults**: Provide initial values for stores and services.
- **Enable Type Safety**: Use `as const` and TypeScript interfaces to ensure configuration values are used correctly.

## Key Configurations

### 🗄️ `database.ts`

Defines the IndexedDB schema, store names, field mappings, and versioning. It is used by the `DatabaseMigrator` and
repositories.

### 🖼️ `views.ts`

Contains field names and mappings used in the UI views. This ensures consistency between the database fields and how
they are presented in forms and tables.

### 🌐 `fetch.ts`

Configuration for external data fetching, including service URLs, selectors for web scraping, and retry policies.

### 🏗️ `components.ts` & `entrypoints.ts`

Defines the structure of the application UI, including layout constants and extension entry points (Popup, Options,
Background).

### 🏷️ `codes.ts` & `events.ts`

Standardized codes for error handling and event names for cross-component communication.

### 📦 `stores.ts`

Initial state and storage keys for Pinia stores.

## Development Principles

1. **Immutability**: Use `as const` for all configuration objects to prevent accidental runtime modifications.
2. **Explicitness**: Prefer descriptive names over abbreviations.
3. **Hierarchy**: Organize configuration into logical groups (e.g., `INDEXED_DB.STORE.ACCOUNTS.FIELDS`).
4. **No Logic**: Configurations should be pure data. Avoid computations or side effects in this layer.

## Usage

Import the needed configuration directly into your components, stores, or services:

```typescript
import { INDEXED_DB } from "@/configs/database";

// Use it in a service
const storeName = INDEXED_DB.STORE.ACCOUNTS.NAME;
```
