### Skill: Sync Translations (`de` master → `en`)

#### Purpose
Verify and fix the English localization files against the German ones, treating **`de` as the
single source of truth**. This closes two gaps `npm run lint:i18n` doesn't check: (1) whether the
`de`/`en` key sets and placeholder tokens are structurally identical, and (2) whether every `en`
string is actually a correct, natural translation of its `de` counterpart — not just present.

#### When to Use
- Periodically, as a standalone translation-quality pass independent of feature work.
- After any change to `src/adapters/ui/_locales/de/*.json` (a new key, an edited German string, a
  reworded warning) — the `en` side needs a matching update and this skill is the way to check it
  actually happened correctly, not just that a key with the same name exists.
- **Not** a substitute for `npm run lint:i18n` (run it first; it catches keys referenced in code
  but absent from a locale — a different, code-vs-locale check this skill doesn't repeat) and
  **not** a substitute for `fix-hardcoded-gui-strings.md` (that skill finds text that never made it
  into `gui.json`/`messages.json` at all; this one assumes the key already exists in both files and
  checks whether the English *content* is right).

---

### Scope
```
src/adapters/ui/_locales/de/gui.json       (master)
src/adapters/ui/_locales/en/gui.json       (target)
src/adapters/ui/_locales/de/messages.json  (master)
src/adapters/ui/_locales/en/messages.json  (target)
```
Nothing else — not `manifest.json`, not code, not other README files. If `de` ever gains a third
sibling locale, extend this skill's scope and automation snippet to include it rather than
re-deriving the approach from scratch.

---

### The Master Rule

**`de` is authoritative for both structure and meaning.** Concretely:
- A key present in `de` but missing from `en` → add it to `en`, translated fresh from the German
  meaning.
- A key present in `en` but missing from `de` → this is an *orphan*. Check whether it's actually
  referenced in code (grep the key, or re-run `npm run lint:i18n`'s used-key extraction). If it's
  unused by any locale, delete it from `en` to restore parity. If it *is* used in code, that means
  **`de` — the master — is the one missing a key**, which is a more serious gap than a stale `en`
  string; flag it explicitly rather than quietly patching around it, since adding a German key on
  your own guess at wording isn't this skill's call to make silently.
- A string that differs in meaning, tone, placeholders, or punctuation intent between `de` and
  `en` → **fix the `en` string to match `de`**, never the other way around.
- If a `de` string itself looks wrong (a typo, unclear phrasing, an inconsistency with the rest of
  the German copy) — that's a real finding, but it's a *German-content* issue, not a translation
  gap. Report it separately and leave the master text alone; don't silently "fix" it as a side
  effect of an `en`-sync pass.

---

### File Shapes (what's actually there, not just what the README aspires to)

- **`gui.json`**: nested JSON, consumed via `vue-i18n`'s `t()`/`tm()`. Placeholders are `{name}`
  style (e.g. `"Eine Sicherungsdatei mit Namen {filename} wird ..."`). Most leaves are plain
  strings, but **some are arrays of paragraph objects** — `views.helpContent.paragraphs` and
  `views.privacyContent.*.paragraphs` are each `{ subTitle, content, icon }[]`, where `content` is
  sometimes a string and sometimes a `string[]`. These are the longest, highest-translation-risk
  blocks in the file and are easy to skip if you only walk plain string leaves — don't naively
  `String()`-stringify an array when flattening for comparison, or every paragraph block will
  falsely look "identical" between locales (it collapses to the same unhelpful
  `"[object Object],[object Object]"` for both). Recurse into arrays with an indexed path segment
  instead (see the automation snippet).
- **`messages.json`**: flat WebExtension `browser.i18n` format, `{ "key": { "message": "..." } }`.
  The `README.md` in this directory describes `$1`/`$NAME$`-style substitution placeholders and a
  `description` field per key as best practice — in this codebase, **neither is actually used**;
  every entry today is a plain `message` string with no placeholders and no description. Don't
  assume placeholder syntax here that isn't present; do still scan for it (the automation snippet
  below does) in case a future entry adds one.

---

### What "Correct" Means for an `en` String

Beyond "the key exists", judge each `en` value against its `de` counterpart for:
1. **Meaning** — does it say what the German says, not just something plausible in context? A
   fluent-sounding but subtly wrong translation is worse than an obviously missing one, because
   nothing flags it.
2. **Placeholders** — exact same `{name}` tokens (gui.json) present, same count, same names. A
   `{count}`/`{total}` pair that's `{count}`-only in `en` silently drops content at render time.
3. **Punctuation intent** — a `de` string ending in `?` is asking the user something (e.g. a
   destructive-action confirmation); the `en` string must end the same way, not with a `.`. Same
   for `!`, ellipses, and multi-paragraph strings using `\n\n`.
4. **Terminology consistency** — a German term should map to the *same* English term everywhere it
   recurs (e.g. "Buchung" → "booking" consistently, not "booking" in one key and "entry" or
   "transaction" in another). Skim sibling keys in the same section when translating a term you
   haven't seen before.
5. **No leftover source-language text** — a literal German word/phrase surviving inside the `en`
   string (or vice versa) is a copy-paste leftover from a partial edit, not a translation choice.
6. **Natural English, not word-for-word German syntax** — German noun-capitalization and clause
   ordering bleeding into the English (e.g. "Please choose a Booking Type" instead of "booking
   type", or clause order that reads as translated rather than written) is a real finding.
7. **Proper nouns and acronyms stay as-is** — `KontenManager`, `IBAN`, `SWIFT`, `ISIN`, `URL`, "OK",
   chemical/element symbols (`Au`, `Ni`, `Pd`, ...) are correctly identical between locales; don't
   flag these as "untranslated" just because the automation snippet's identical-value heuristic
   surfaces them — that heuristic is a starting point for eyeballing, not a verdict.

---

### Update Playbook (Step-by-Step)

1. **Run `npm run lint:i18n` first.** It's the fast, existing, code-vs-locale check (keys used in
   code but missing from a locale, and keys defined but unused anywhere). Fix anything it reports
   before starting the deeper pass below — this skill assumes that baseline is already clean.
2. **Run the automation snippet** (below) to get an objective structural diff between `de` and
   `en`: keys only in `de` (missing in `en`), keys only in `en` (orphans against the master),
   placeholder-token mismatches per shared key, and a list of value-identical pairs to eyeball.
3. **Close structural gaps first** (fast, mechanical): add any `de`-only key to `en` with a fresh
   translation; resolve `en`-only orphans per the Master Rule above (delete if unused anywhere,
   flag rather than silently patch if the key turns out to be used in code).
4. **Read both `gui.json` files fully, key by key** (the flattened/recursed output from the
   snippet is enough — you don't need to re-open the raw nested JSON by hand). For every shared
   key, judge the `en` value against `de` per the "What 'Correct' Means" checklist above. Do the
   same for both `messages.json` files (smaller — 50 entries each, all flat).
   - The two `paragraphs` arrays are worth reading as full passages, not just per-sentence — a
     paragraph can be individually-correct sentence-by-sentence and still lose the German's meaning
     in aggregate (wrong emphasis, dropped nuance).
   - For a codebase this size (~270 `gui.json` keys, 50 `messages.json` keys), doing this in one
     inline pass is the right amount of ceremony — no need to delegate to subagents. If the file
     set grows substantially, split by top-level `gui.json` section instead of by locale (keep a
     `de`/`en` pair together in one reviewer's scope so drift can actually be compared).
5. **Fix every genuine finding by editing `en` only.** If a `de`-side issue surfaces (typo, unclear
   wording, an actually-missing master key from step 3), collect these separately and report them
   to the user rather than editing `de` — that's not this skill's call.
6. **Re-run the automation snippet** to confirm zero structural gaps remain, then re-run
   `npm run lint:i18n`.
7. **Run the local gate**:
   ```powershell
   npm run test:unit
   npm run test:typescript
   npm run lint
   ```
   Both `*.json` files are hand-edited plain JSON — a trailing comma or mismatched brace fails
   silently at runtime (the string just doesn't render) rather than at compile time. Spot-check
   both files still parse if you hand-edited them directly:
   ```powershell
   Get-Content src/adapters/ui/_locales/en/gui.json -Raw | ConvertFrom-Json | Out-Null
   Get-Content src/adapters/ui/_locales/en/messages.json -Raw | ConvertFrom-Json | Out-Null
   ```

---

### Automation Snippet (Node.js)

Structural + placeholder-parity diff, `de` as master. Handles array-shaped leaves (the
`paragraphs` blocks) by recursing into arrays with an indexed path segment instead of
stringifying them, so those blocks show up as their real per-sentence leaves rather than one
useless "identical" blob. Save as a scratch `.mjs` file and run with `node`.

```js
import fs from "node:fs";

const BASE = "src/adapters/ui/_locales";

function flatten(value, prefix, out) {
    if (Array.isArray(value)) {
        value.forEach((v, i) => flatten(v, `${prefix}[${i}]`, out));
    } else if (value && typeof value === "object") {
        for (const [k, v] of Object.entries(value)) {
            flatten(v, prefix ? `${prefix}.${k}` : k, out);
        }
    } else {
        out[prefix] = String(value);
    }
    return out;
}

function load(locale, file) {
    const raw = JSON.parse(fs.readFileSync(`${BASE}/${locale}/${file}`, "utf-8"));
    return flatten(raw, "", {});
}

function tokens(str, re) {
    return new Set([...str.matchAll(re)].map((m) => m[0]));
}

function compare(file, placeholderRe) {
    const de = load("de", file);
    const en = load("en", file);
    const deKeys = new Set(Object.keys(de));
    const enKeys = new Set(Object.keys(en));

    const onlyDe = [...deKeys].filter((k) => !enKeys.has(k)).sort();
    const onlyEn = [...enKeys].filter((k) => !deKeys.has(k)).sort();

    const placeholderMismatches = [];
    const identical = [];
    for (const k of deKeys) {
        if (!enKeys.has(k)) continue;
        const deTokens = tokens(de[k], placeholderRe);
        const enTokens = tokens(en[k], placeholderRe);
        const same = deTokens.size === enTokens.size && [...deTokens].every((t) => enTokens.has(t));
        if (!same) {
            placeholderMismatches.push({key: k, de: [...deTokens], en: [...enTokens]});
        }
        if (de[k] === en[k] && de[k].trim() !== "") {
            identical.push(k);
        }
    }

    console.log(`\n=== ${file} ===`);
    console.log(`de keys: ${deKeys.size}, en keys: ${enKeys.size}`);
    console.log(`Missing in en (${onlyDe.length}):`, onlyDe);
    console.log(`Orphans only in en (${onlyEn.length}):`, onlyEn);
    console.log(`Placeholder mismatches (${placeholderMismatches.length}):`);
    placeholderMismatches.forEach((m) => console.log(`  ${m.key}: de=${m.de} en=${m.en}`));
    console.log(`Identical values to eyeball (${identical.length}):`, identical);
}

compare("gui.json", /\{[a-zA-Z0-9_]+\}/g);
compare("messages.json", /\$[A-Za-z0-9_]+\$|\$\d+/g);
```

---

### Quality Checklist
- [ ] `npm run lint:i18n` passes before and after.
- [ ] `de` and `en` have identical key sets in both `gui.json` and `messages.json` (automation
      snippet reports zero "missing in en" and zero "orphans only in en", or every orphan is
      explicitly accounted for per the Master Rule).
- [ ] Every shared key's placeholder tokens match exactly between `de` and `en`.
- [ ] Every `en` string was actually read against its `de` counterpart for meaning, tone,
      punctuation intent, and terminology consistency — not just checked for key presence.
- [ ] Both `paragraphs` arrays (`helpContent`, `privacyContent`) were read as full passages, not
      skipped because they're array-shaped.
- [ ] No fix touched `de` — every correction landed in `en`. Any genuine `de`-side issue was
      reported separately, not silently rewritten.
- [ ] Both locale JSON files still parse as valid JSON.
- [ ] `npm run test:unit`, `npm run test:typescript`, `npm run lint` all pass.

---

### Tips
- The identical-value list is a heuristic, not a verdict — most hits are legitimate (proper nouns,
  acronyms, single-word UI chrome like "OK"). It's there to save you from re-deriving "is this
  actually a real word in both languages" from scratch for every key; skim it, don't distrust it.
- When translating a term you haven't seen before, grep the rest of `en/gui.json` for how a
  similar `de` term was already rendered elsewhere, rather than picking a new synonym.
- A `de` string spanning multiple sentences via `\n\n` (see
  `components.dialogs.importDatabase.messages.confirmUndatedWarning`) needs its `en` counterpart to
  preserve the same paragraph breaks, not collapse them into one block.

---

### Maintenance
- Re-run this skill whenever `de/gui.json` or `de/messages.json` changes, or periodically as a
  standalone quality pass.
- If a third locale is ever added, decide whether it also treats `de` as master (matching this
  project's existing single-master setup) or gets its own sync direction, and update this file's
  Scope and automation snippet accordingly rather than leaving it `de`/`en`-only by accident.
