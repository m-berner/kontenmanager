# Scripts (`scripts/`)

This directory contains various utility scripts for development, maintenance, and build processes.

## Key Scripts

- `i18n-lint.mjs`: Validates i18n JSON files for consistency and completeness.
- `find-hardcoded-gui-strings.ps1`: A PowerShell script to help identify strings that should be moved to localization files.

README updates across the project are no longer script-generated; follow the `update-documentation`
skill (`skills/update-documentation.md`) instead.

## Running Scripts

Most scripts can be run directly with `node` or via `npm` commands defined in `package.json`.

Example:
```bash
npm run lint:i18n
```

## Directory Structure

### Files

- `find-hardcoded-gui-strings.ps1`
- `i18n-lint.mjs`: TRANSLATION_KEYS

