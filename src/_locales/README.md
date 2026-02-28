# Localization Layer

This directory contains the translation files for the application's internationalization (i18n). It follows the standard
WebExtension `_locales` structure.

## Structure

- `de/`: German localization.
    - `messages.json`: Key-value pairs for all user-facing messages in German (WebExtension `browser.i18n` format).
    - `gui.json`: Key-value pairs for user facing strings that are not messages (Standard JSON format).
- `en/`: English localization.
    - `messages.json`: Key-value pairs for all user-facing messages in English (WebExtension `browser.i18n` format).
    - `gui.json`: Key-value pairs for user facing strings that are not messages (Standard JSON format).

## Role and Responsibilities

- **User Interface Text**: Store all labels, button texts, tooltips, and headings (primarily in `gui.json`).
- **Messages**: Store user-facing messages, often with placeholders (primarily in `messages.json`).
- **Error Messages**: Provide human-readable descriptions for application error codes.
- **Notification Messages**: Store strings used for browser notifications.

## Maintenance and Linting

The project includes custom scripts to ensure translation quality:

- **Linting**: Run `npm run i18n:lint` to find missing or inconsistent keys between languages.
- **Strict Linting**: Run `npm run i18n:lint:strict` to also find unused translation keys.

## Best Practices

1. **Key Naming**: Use descriptive, hierarchical keys (e.g., `dialog_account_add_title`).
2. **Consistency**: Ensure that a key added to one language is also added to all other supported languages.
3. **Placeholders**: Use standard WebExtension placeholders for dynamic content (e.g., `$1`, `$2`) in `messages.json`.
   For `gui.json`, use `vue-i18n` style placeholders (e.g., `{name}`).
4. **Descriptions**: Provide descriptions for keys in `messages.json` to help translators understand the context.

## Usage in Code

### In Vue Components (via `vue-i18n` and `gui.json`)

```vue
<template>
  <v-btn>{{ $t('button_save') }}</v-btn>
</template>
```

### In TypeScript (via WebExtension API and `messages.json`)

```typescript
const message = browser.i18n.getMessage("error_database_failed");
```
