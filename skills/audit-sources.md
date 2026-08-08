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
src/adapters/driven/**   (including adapters/driven/database/**, adapters/driven/fetch/**)
src/adapters/ui/**       (stores, composables, components, dialogs, views, entrypoints, plugins)
```
Read `src/ARCHITECTURE.md` first if unfamiliar with the layering — dependencies point inward
(`adapters → app → domain`), and a bug's correct fix location often depends on which layer owns the
invariant being violated. `src/WORKFLOWS.md` documents the intended behavior of each user-facing
flow in detail; use it to judge whether behavior you're reading is a bug or an intentional design
choice before "fixing" it.

Audit one layer/directory at a time rather than skimming the whole tree at once — bugs in this
codebase tend to cluster around stateful code (DB transactions, connection lifecycle, batch
operations, Pinia stores with async actions) more than in pure functions, so budget more attention
there.

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

Do **not** flag: formatting/style nits ESLint would catch, missing i18n coverage (that's
[[fix-hardcoded-gui-strings]]), missing test coverage by itself (that's
[[add-missing-tests]] — though a bug you find here often reveals a test gap worth noting), or
subjective naming/structure preferences with no behavioral consequence.

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
   `src/WORKFLOWS.md` for the intended behavior of anything transaction- or money-related.

3. **Confirm before fixing.** For anything non-obvious, write a one-line failure scenario ("input X
   → wrong output Y") before touching code — if you can't state a concrete failure scenario, it's
   not a confirmed bug, just a suspicion; note it separately instead of fixing it.

4. **Fix at the right layer.** Respect the hexagonal boundaries in `src/ARCHITECTURE.md` — a domain
   bug gets fixed in `domain/`, not patched over in the adapter that calls it.

5. **Run the full local gate** before considering the pass done:
   ```powershell
   npm run test:logic
   npm run test:typescript
   npm run lint
   npm run lint:i18n
   ```
   Run `npm run test:e2e` too if any fix touches a user-facing flow or DB migration path.

6. **Commit with severity buckets.** Group the commit message by High/Medium/Low, one bullet per
   fix, each stating the symptom and the mechanism of the fix (not just "fixed bug in X") — follow
   the format of `git log --grep audit -i` for this repo's exact convention.

---

### Quality Checklist
- [ ] Every fix has a stated concrete failure scenario, not just "this looked wrong."
- [ ] Fix lives in the architecturally correct layer (`domain` vs `app/usecases` vs `adapters`).
- [ ] No fix silently loosens `tests/unit/architecture.test.ts` or adds a disallowed cross-layer
      import.
- [ ] `npm run test:logic`, `npm run test:typescript`, `npm run lint`, `npm run lint:i18n` all pass.
- [ ] `npm run test:e2e` passes if a DB migration, transaction, or user-facing flow changed.
- [ ] Commit message buckets fixes by High/Medium/Low severity.
- [ ] Uncertain findings (no concrete failure scenario) are called out separately, not silently
      fixed or silently dropped.

---

### Tips
- Trust but verify your own read of "intentional" — if a branch looks asymmetric (one path clears
  state, the other doesn't), assume it's a bug until `WORKFLOWS.md` or a test proves otherwise.
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