# Scripts (`scripts/`)

This directory contains various utility scripts for development, maintenance, and build processes.

## Key Scripts

- `update-readmes.mjs`: Automatically generates and updates `README.md` files across the project based on the directory structure and file exports.
- `i18n-lint.mjs`: Validates i18n JSON files for consistency and completeness.
- `find-hardcoded-gui-strings.ps1`: A PowerShell script to help identify strings that should be moved to localization files.

## Running Scripts

Most scripts can be run directly with `node` or via `npm` commands defined in `package.json`.

Example:
```bash
npm run update:readmes
```

## Directory Structure

### Files

- `find-hardcoded-gui-strings.ps1`
- `i18n-lint.mjs`: TRANSLATION_KEYS
- `update-readmes.mjs`: a, b, (default)

