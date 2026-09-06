### Skill: Audit `src/` for Weaknesses, Issues, and Bugs

#### Purpose
Systematically read through `src/` and its subfolders looking for correctness bugs, data-integrity
risks, race conditions, and other latent defects — not just what a linter or type checker would
already catch — then fix what's found and verify with the full local gate.

#### When to Use
- Periodically, as a standalone hardening pass independent of any specific feature work.
- As a re-audit after a previous audit round landed fixes, to catch issues the prior pass missed or
  that a fix itself introduced (this repo has already gone through several rounds — see `git log
  --oneline | grep -i audit`).
- **Not** a substitute for `/code-review` on a working diff — this skill is a broad, whole-tree
  sweep, not a review of a specific change.

---

### Scope
All of `src/` and its subfolders:
```
src/domain/**
src/app/usecases/**
src/adapters/driven/**       (including adapters/driven/database/**, adapters/driven/fetch/**)
src/adapters/ui/**           (stores, composables, components, dialogs, views, entrypoints, plugins)
src/adapters/ui/_locales/**  (translation files — see "Locale files" below; not skippable)
src/adapters/ui/assets/**    (binary icons only — no source to audit, skip)
```
Read `src/README.md`'s "Architecture" section first if unfamiliar with the layering — dependencies point inward
(`adapters → app → domain`), and a bug's correct fix location often depends on which layer owns the
invariant being violated. `src/app/usecases/README.md`'s "Workflows" section documents the intended
behavior of each user-facing flow in detail; use it to judge whether behavior you're reading is a
bug or an intentional design choice before "fixing" it.

Audit one layer/directory at a time rather than skimming the whole tree at once — bugs in this
codebase tend to cluster around stateful code (DB transactions, connection lifecycle, batch
operations, Pinia stores with async actions) more than in pure functions, so budget more attention
there. When time allows, split the tree into 3-4 roughly file-count-balanced slices (e.g.
domain+usecases / adapters-driven / ui-components+composables / ui-stores+views+entrypoints+plugins)
and delegate each to a parallel subagent instructed to read every file in its slice fully and
report only findings it has verified against current file content — this gets full-tree coverage
in one pass instead of a partial skim, and cross-checks the same suspected bug class from
independent angles.

#### Locale files
`src/adapters/ui/_locales/**` needs a different check than the rest of the tree — it's data, not
logic, so "read every file" means checking *consistency*, not tracing control flow:
1. Run `npm run lint:i18n` (catches keys used in code but missing from a locale, per
   `scripts/i18n-lint.mjs`).
2. Confirm the `de`/`en` key sets are identical for both `gui.json` and `messages.json` (the lint
   script doesn't check this directly — a key present in one locale but not the other silently
   falls back or renders blank rather than failing the lint).
3. Check placeholder/interpolation tokens match between locales for every shared key — WebExtension
   `$1`/`$NAME$` style in `messages.json`, `vue-i18n` `{name}` style in `gui.json`. A token present
   in one language's string but missing from the other silently drops dynamic content at render
   time without any tool flagging it.
This is cheap and scriptable (a `node -e` one-liner comparing flattened key sets and regex-matched
placeholder tokens per key); do it even on a quick audit pass, not just a full one.

---

### What to Look For

Prioritize categories that have historically turned up real bugs in this codebase, roughly in
order of how much attention they deserve:

1. **Data integrity** — silent data loss, truncation, or corruption. Numeric/currency parsing that
   misclassifies formats (e.g. German `1.234,56` vs US `1,234.56`), values dropped because a
   "missing" sentinel collides with a legitimate value (e.g. `0` treated as absent), floating-point
   residue not clamped against a documented threshold, backup/restore paths that don't round-trip.
2. **State/store consistency** — a Pinia store or in-memory cache left out of sync with the
   database after a mutation (e.g. one branch of an if/else clears dependent state, the other
   doesn't), orphaned records after a delete, duplicate keys in lists rendered by id (check
   Vuetify `:key` bindings against what's actually unique).
3. **Async races and IndexedDB lifecycle** — `onblocked`/`onupgradeneeded`/`onsuccess` handlers
   that can fire out of order or after a request was already abandoned, transactions not awaited
   before a dependent read, concurrent mutation of an array/queue that's being iterated or awaited
   over (snapshot before await, not after).
4. **Error handling** — swallowed errors (empty `catch`), errors that reference the wrong context,
   `AppError`/`ERROR_DEFINITIONS` codes that don't match their message, rollback paths that don't
   actually undo a partial write (e.g. a DB write that succeeds but a follow-up persisted-state
   write fails, leaving them inconsistent).
5. **Off-by-layer violations** — a `domain/**` or `app/usecases/**` file reaching for something
   `tests/unit/architecture.test.ts` should have blocked (Vue, Pinia, browser APIs, i18n) — even if
   the test currently passes, check whether an added import quietly widened what a layer depends on.
6. **Unbounded growth** — caches, message logs, or dedup sets that accumulate for the lifetime of a
   long session with nothing capping size or pruning by age.
7. **Styling/UX correctness that mirrors a logic bug** — a CSS class applied conditionally but never
   defined, a computed value captured once (`const label = t(...)`) instead of staying reactive,
   a value fetched/stored with mismatched casing (e.g. exchange codes uppercased on save but not on
   lookup).

Do **not** flag: formatting/style nits ESLint would catch, missing i18n coverage — i.e. hardcoded
strings that were never localized at all (that's [[fix-hardcoded-gui-strings]]) — missing test
coverage by itself (that's [[add-missing-tests]] — though a bug you find here often reveals a test
gap worth noting), or subjective naming/structure preferences with no behavioral consequence. Do
**flag** translation *key drift* under "Locale files" above (a key referenced in code but absent
from a locale, a key present in one locale but not the other, or mismatched placeholder tokens
between locales) — that's a correctness bug in already-localized content, not a coverage gap.

---

### Severity Classification
Classify every confirmed issue as **High**, **Medium**, or **Low** before fixing, and keep that
classification in the commit message (this repo's established convention — see recent `dev: fix
issues found in ... audit` commits):

- **High** — silent data corruption/loss, a user-visible incorrect financial figure, a crash, or a
  race that can drop/duplicate a database record.
- **Medium** — incorrect behavior that's contained (wrong value in one non-critical computed field,
  a fallback that doesn't fire, a UI element unstyled) or a rollback gap that leaves recoverable but
  inconsistent state.
- **Low** — unbounded-growth risks in normal (non-adversarial) usage, reactivity nits, dead code
  paths, edge cases requiring unusual input to trigger.

---

### Update Playbook (Step-by-Step)

1. **Pick a slice.** Either one architectural layer (e.g. all of `adapters/driven/database/**`) or
   one prior audit's leftover area. Don't try to hold the whole tree in context at once.

2. **Read fully, not by grep.** Open each file in the slice with Read and follow its call chain —
   many of this codebase's real bugs are only visible by tracing a value from where it's parsed to
   where it's consumed (a mismatch invisible from either file in isolation). Cross-check against
   `src/app/usecases/README.md`'s "Workflows" section for the intended behavior of anything
   transaction- or money-related.

3. **Confirm before fixing.** For anything non-obvious, write a one-line failure scenario ("input X
   → wrong output Y") before touching code — if you can't state a concrete failure scenario, it's
   not a confirmed bug, just a suspicion; note it separately instead of fixing it.

4. **Write findings to `ISSUES.md`.** Before fixing, record the pass's results in
   `ISSUES.md` (create it if absent, overwrite if a prior pass's file is still there and
   already fully resolved). Structure:
   - A short "Scope & method" section: which slices/directories were covered, whether via direct
     reading or delegated subagents, and locale-file checks run.
   - "Findings" — one entry per confirmed issue, ranked most-severe first, each with **File**
     (path:line), **Issue**, **Failure scenario**, **Suggested fix**, and a **Status** line
     (fixed / not yet fixed) you update as you go.
   - "Checked and confirmed correct" — anything a prior audit or this one's own leads suspected but
     that traced out to be intentional/already-fixed; this prevents the next round from
     re-investigating the same dead end from scratch.
   - "Coverage gaps / caveats" — anything skipped, any tool's known blind spot (e.g. `i18n-lint.mjs`
     can't see dynamically-constructed keys), whether tests/e2e were run this pass.
   This file is the audit's durable record independent of whether every fix lands in the same
   session — a re-audit should read it first rather than starting blind.

5. **Fix at the right layer.** Respect the hexagonal boundaries in `src/README.md`'s "Architecture" section — a domain
   bug gets fixed in `domain/`, not patched over in the adapter that calls it. Update each finding's
   **Status** line in `ISSUES.md` as it's fixed.

6. **Run the full local gate** before considering the pass done:
   ```powershell
   npm run test:unit
   npm run test:typescript
   npm run lint
   npm run lint:i18n
   ```
   Run `npm run test:e2e` too if any fix touches a user-facing flow or DB migration path.

7. **Commit with severity buckets.** Group the commit message by High/Medium/Low, one bullet per
   fix, each stating the symptom and the mechanism of the fix (not just "fixed bug in X") — follow
   the format of `git log --grep audit -i` for this repo's exact convention.

8. **Retire the findings file once clean.** Once every finding in `ISSUES.md` is fixed,
   verified, and committed, delete the file — this repo's established convention is that the
   rationale lives on in code comments and commit messages, not as a standing register (confirm
   with the user before deleting if they've indicated they want it kept as a running log instead).

---

### Quality Checklist
- [ ] `src/adapters/ui/_locales/**` checked (`lint:i18n` + key-set parity + placeholder-token
      parity between `de`/`en`), not just the `.ts`/`.vue` tree.
- [ ] `ISSUES.md` written before fixes started, with Scope & method / Findings /
      Checked-and-confirmed-correct / Coverage gaps sections.
- [ ] Every fix has a stated concrete failure scenario, not just "this looked wrong."
- [ ] Fix lives in the architecturally correct layer (`domain` vs `app/usecases` vs `adapters`).
- [ ] No fix silently loosens `tests/unit/architecture.test.ts` or adds a disallowed cross-layer
      import.
- [ ] `npm run test:unit`, `npm run test:typescript`, `npm run lint`, `npm run lint:i18n` all pass.
- [ ] `npm run test:e2e` passes if a DB migration, transaction, or user-facing flow changed.
- [ ] Commit message buckets fixes by High/Medium/Low severity.
- [ ] Uncertain findings (no concrete failure scenario) are called out separately, not silently
      fixed or silently dropped.
- [ ] `ISSUES.md` deleted once every finding in it is fixed and committed (or kept, if
      the user asked for a running log instead).

---

### Tips
- Trust but verify your own read of "intentional" — if a branch looks asymmetric (one path clears
  state, the other doesn't), assume it's a bug until `app/usecases/README.md`'s "Workflows" section
  or a test proves otherwise.
- IndexedDB connection lifecycle code (`adapters/driven/database/connectionManager.ts` and
  neighbors) has produced real bugs before around event-ordering assumptions — read the MDN spec
  behavior, don't assume handlers fire in the order you'd expect.
- When a fix changes a computation (e.g. a threshold, a rounding rule), grep for every other call
  site of the same underlying value to check whether the same bug is duplicated elsewhere (it often
  is — e.g. a `MINIMUM_THRESHOLD` applied in one calculation but not a sibling one).
- Re-running this skill on the same tree shortly after a previous round is expected and useful — a
  fix can introduce a new asymmetry, and a broad first pass often leaves smaller issues for a
  focused second pass to find.

---

### Maintenance
- Re-run this skill periodically, or after a batch of feature work has landed without an
  accompanying audit pass.
- If a category in "What to Look For" stops producing findings across two consecutive audits,
  deprioritize it in favor of whatever categories are still surfacing bugs.