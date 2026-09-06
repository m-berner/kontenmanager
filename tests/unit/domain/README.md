# Domain (`tests/unit/domain/`)

Unit tests for `src/domain/` — the framework-independent business-rule layer (see `src/domain/README.md`
for its principles). `errors.test.ts` and `logic.test.ts` cover the top-level `errors.ts` /
`logic.ts` modules directly; everything else mirrors a `src/domain/` subdirectory 1:1 (`importExport/`, `mapping/`,
`utils/`, `validation/`). `constants/` and `types/` have no tests
here — the former is static configuration, the latter is type-only.

## Directory Structure

### Directories

- `importExport/`
- `mapping/`
- `utils/`
- `validation/`

### Files

- `errors.test.ts`
- `logic.test.ts`
