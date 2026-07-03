### Skill: Update Documentation (READMEs, ARCHITECTURE.md, WORKFLOW[S].md)

#### Purpose
Provide a reliable, repeatable process to update all `README.md` files across the repository, as well as `ARCHITECTURE.md` and `WORKFLOW.md`/`WORKFLOWS.md`. Ensures consistent structure, links, and style without breaking existing developer workflows.

#### When to Use
- You need to refresh documentation after refactors, new features, or reorganization.
- You want to enforce a uniform README template across modules/packages.
- You must align high-level docs (`ARCHITECTURE.md`, `WORKFLOW.md`/`WORKFLOWS.md`) with current code and processes.

#### Scope
- All `README.md` files from the repo root downward (monorepo-friendly).
- `ARCHITECTURE.md` at repo root (or `src/ARCHITECTURE.md` if present).
- `WORKFLOW.md` or `WORKFLOWS.md` (support both names, prefer plural if both exist).

---

### Conventions and Style
- Tone: concise, imperative, developer-first. Prefer examples and commands.
- Language: default to English unless a folder/README is clearly localized.
- Headings:
  - Use `###` for top sections (project docs render well in narrow panes).
  - Use backticks for inline code and triple backticks for code blocks.
- Links: Prefer relative paths within the repo; avoid absolute Git provider URLs unless necessary.
- Badges: Keep at most the essential set (CI, coverage, version) in root `README.md` only.
- Images: Store in a nearby `docs/` or `assets/` folder; use relative links.

---

### Standard Templates

#### Module README template (apply to each folder-level `README.md`)
```
### <Module Name>

#### Purpose
One sentence on what this module does and where it fits in the architecture.

#### Key APIs
- `functionOrClassName(args)`: Short description of what it returns/does.
- Link to source: `./src/...` (relative path)

#### Usage
```
// minimal usage example
```

#### Configuration
- Env vars, feature flags, or settings with defaults.

#### Testing
```
npm run test:logic -- tests/unit/<module>/*.test.ts
```

#### Notes
- Known constraints, TODOs, or references.
```

#### Root README key sections (only in `/README.md`)
- Project overview and goals
- Quickstart (install, run, test)
- Folder structure
- Environments/build matrix
- Release/packaging (if applicable)
- Links to `ARCHITECTURE.md` and `WORKFLOWS.md`

#### ARCHITECTURE.md outline
```
### Architecture

#### System Context
- Users, external systems, high-level boundaries.

#### Building Blocks
- Modules/packages and responsibilities.

#### Data & Persistence
- Stores, schemas, indexes, migrations (link to code where relevant).

#### Cross-cutting Concerns
- Error handling, logging, configuration, security/privacy.

#### Diagrams
- Keep simple, add mermaid where helpful.
```

#### WORKFLOW(S).md outline
```
### Workflows

#### Development
- Branching strategy, coding standards, running tests.

#### CI/CD
- What runs on PR/merge, how to release.

#### Testing Pyramid
- Unit, integration, e2e; how to run each locally.

#### Issue Lifecycle
- From creation to done; links to templates.
```

---

### Update Playbook (Step-by-Step)

1. Inventory documentation files
   - Target patterns:
     - All `README.md` files
     - `ARCHITECTURE.md`
     - `WORKFLOW.md` and/or `WORKFLOWS.md`

2. Review current structure and decide deltas
   - Compare existing content to the templates above.
   - Identify missing sections, stale commands/links, and inconsistent headings.

3. Apply updates uniformly
   - Normalize top-level sections and heading levels (`###` primary, `####` secondary).
   - Ensure code blocks use triple backticks and specify language where useful.
   - Replace absolute repo URLs with relative paths.

4. Validate links and commands
   - Run installation and key commands in a clean environment if feasible.
   - Ensure test commands match the actual `package.json` scripts.

5. Summarize changes in the root `README.md` changelog section (if present)
   - Briefly note documentation refresh and key structural changes.

6. Open PR with a clear description
   - List touched files and what changed.

---

### Automation Snippets (Windows PowerShell)

List all target files from repo root:
```
# All READMEs
Get-ChildItem -Recurse -Filter README.md | Select-Object -Expand FullName

# Architecture/workflow variants
Get-ChildItem -Recurse -Filter ARCHITECTURE.md | Select-Object -Expand FullName
Get-ChildItem -Recurse -Include WORKFLOW.md,WORKFLOWS.md -File | Select-Object -Expand FullName
```

Simple check for empty essential sections in READMEs:
```
$files = Get-ChildItem -Recurse -Filter README.md
foreach ($f in $files) {
  $c = Get-Content -Raw $f.FullName
  if ($c -notmatch '###\s+Purpose') { Write-Host "[WARN] Missing Purpose: $($f.FullName)" }
  if ($c -notmatch '###\s+Usage')   { Write-Host "[WARN] Missing Usage: $($f.FullName)" }
}
```

In-place heading normalization (example: promote `##` to `###`):
```
(Get-Content -Raw README.md) -replace "(?m)^## ", "### " | Set-Content README.md
```

Batch normalize all READMEs (use with care; commit before running):
```
git add -A; git commit -m "chore(docs): snapshot before batch normalize" --no-verify

Get-ChildItem -Recurse -Filter README.md | ForEach-Object {
  $p = $_.FullName
  $c = Get-Content -Raw $p
  $n = $c -replace "(?m)^## ", "### "
  if ($n -ne $c) { $n | Set-Content $p; Write-Host "Updated headings in $p" }
}
```

---

### Quality Checklist
- [ ] Root `README.md` has Quickstart, Structure, and links to `ARCHITECTURE.md` and `WORKFLOW(S).md`.
- [ ] Every module `README.md` includes Purpose, Key APIs, Usage, Testing.
- [ ] All code blocks are fenced with triple backticks; inline code uses single backticks.
- [ ] Relative links resolve correctly within the repo.
- [ ] Headings normalized to `###`/`####` pattern.
- [ ] Removed stale sections and replaced external dead links.

---

### Tips
- If a module is internal-only, say so in its Purpose.
- Prefer short runnable examples over long narratives.
- Keep diagrams small and focused; prefer mermaid when text-based is sufficient.
- If both `WORKFLOW.md` and `WORKFLOWS.md` exist, consolidate into `WORKFLOWS.md` and leave a short note in `WORKFLOW.md` pointing to the canonical file.

---

### Maintenance
- Re-run this skill after large refactors, dependency overhauls, or CI changes.
- Consider adding a periodic “docs health” task to your project board.
