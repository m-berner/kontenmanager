# Scripts (`scripts/`)

This directory contains various utility scripts for development, maintenance, and build processes.

## Key Scripts

- `i18n-lint.mjs`: Validates i18n JSON files for consistency and completeness.

README updates across the project are no longer script-generated; follow the `update-documentation`
skill (`skills/update-documentation.md`) instead. Likewise, finding and fixing hardcoded GUI
strings is no longer script-driven; follow the `fix-hardcoded-gui-strings` skill
(`skills/fix-hardcoded-gui-strings.md`) instead.

## Running Scripts

Most scripts can be run directly with `node` or via `npm` commands defined in `package.json`.

Example:
```bash
npm run lint:i18n
```

## Directory Structure

### Files

- `i18n-lint.mjs`: TRANSLATION_KEYS

