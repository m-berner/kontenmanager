### Skill: Find and Fix Hardcoded GUI Strings

#### Purpose
Find user-facing text that is hardcoded in source instead of routed through `vue-i18n`, and fix
it: add matching `de`/`en` keys to `src/adapters/ui/_locales/*/gui.json`, then replace the literal
with a translated lookup using the pattern appropriate to the file's architectural layer.

#### When to Use
- After adding a new Vue component, dialog, store action, or composable that shows text, a title,
  a label, or an error message to the user.
- Periodically, to close gaps left by code that was written without i18n in mind.
- **Not** for internal-only strings: log messages (`log(...)`), error *codes*
  (`ERROR_DEFINITIONS.*.CODE`), dialog/action identifiers (`openDialog("addStock")`), CSS classes,
  route names, or `xx_`-prefixed browser-extension message keys — those aren't shown to end users
  and don't belong in `gui.json`.

---

### Scope
Scans `src/**/*.{vue,ts,tsx,js,jsx}`, excluding `node_modules`, `src/infra/_locales`,
`src/infra/assets`, and (by default) `*.test.ts`/`*.spec.ts` files.

---

### The Four Fix Patterns

Which pattern applies depends on whether the file has access to a Vue setup context. Pick by
layer, not by habit — using `useI18n()` where it isn't available breaks the build, and adding an
i18n dependency to `domain`/`app/usecases` violates `tests/unit/architecture.test.ts`.

**1. Vue SFC (`.vue` component, `<script setup>`)** — has full Vue context.
```vue
<script lang="ts" setup>
import {useI18n} from "vue-i18n";
const {t} = useI18n();
</script>

<template>
  <v-btn :aria-label="t('components.dotMenu.openMenu')" .../>
  <p>{{ t("components.dynamicList.loading") }}</p>
</template>
```
- Static attribute literals (`aria-label="Open menu"`) become bound (`:aria-label="t('...')"`).
- Template text nodes (`>Loading...<`) become mustache interpolations (`{{ t('...') }}`).
- `catch` blocks calling `alertAdapter.feedbackError("Some Title", err, ...)` get the literal
  title replaced with `t('...')`. See `src/adapters/ui/components/DotMenu.vue` and
  `src/adapters/ui/components/dialogs/forms/BaseDialogForm.vue`.

**2. Composable that already receives `t` as a parameter or via `useI18n()`** — same as pattern 1,
just check whether the composable is called from within a component setup (it can call
`useI18n()` itself) or is a plain function that should accept `t` as an argument from its caller
(see `useMenuAction(t)` in `DotMenu.vue`). Don't call `useI18n()` from a composable invoked outside
setup context — it will throw.

**3. Pinia store (`.ts`, outside any component)** — no Vue setup context, but stores are created
after Pinia during app bootstrap, and the i18n instance becomes available a step later. Use the
`getStoreTranslate()` side-channel in `src/adapters/ui/stores/deps.ts`, with an English fallback
for the (brief) window before it's wired:
```ts
import {getStoreTranslate} from "@/adapters/ui/stores/deps";

function errorTitle(): string {
    const t = getStoreTranslate();
    return t ? t("stores.settings.errorTitle") : "Settings error";
}
// ...
await alertAdapter.feedbackError(errorTitle(), err, {});
```
It is wired once per entrypoint via `attachStoreTranslate(pinia, i18n.global.t)` — already present
in `src/adapters/ui/entrypoints/app.ts` and `options.ts`. You should not need to touch the
entrypoints or `deps.ts` again; just call `getStoreTranslate()` from the store. See
`src/adapters/ui/stores/settings.ts` and `src/adapters/ui/stores/alerts.ts`.

**4. `domain/**` or `adapters/driven/**` (no Vue, no Pinia, no i18n allowed)** — these layers must
stay translation-agnostic (`architecture.test.ts` forbids `app/usecases/**` from importing
`vue`/`pinia`, and `domain` sits below that). Don't add i18n here. Instead, if the literal is a
repeated fallback like `"Unknown error"`, extract it into a shared constant in
`src/domain/errors.ts` (`ERROR_DEFINITIONS.UNKNOWN_ERROR.MSG`) and reference that constant from
every call site instead of restating the string. See the `errors.ts` / `healthChecker.ts` /
`useImportDialog.ts` diffs for the pattern — one constant, multiple consumers.

---

### Locale Key Conventions
- Keys mirror the source file's path under `src/adapters/ui/`, camelCased per segment:
  `components/dialogs/forms/BaseDialogForm.vue` → `components.dialogs.forms.baseDialogForm.*`;
  `stores/settings.ts` → `stores.settings.*`; `views/TitleBar.vue` → `views.titleBar.*`.
- Add the **same key to both** `src/adapters/ui/_locales/en/gui.json` and `.../de/gui.json`, kept
  in the same nested position in both files. Write a real German translation, not a copy of the
  English string.
- Reuse an existing key/namespace (e.g. `components.dialogs.forms.baseDialogForm.errorTitle`,
  already used generically for dialog error titles) instead of minting a near-duplicate when one
  already fits.
- Suffix conventions already in use: `...Title` for alert/dialog titles, `...Label` for form
  field labels, `...ErrorTitle` for `feedbackError` titles, `Placeholder`, `Hint`.

---

### Update Playbook (Step-by-Step)

1. **Run the detection snippet below** to list candidate hardcoded strings, grouped by file.
2. **Triage each finding.** Most raw hits are noise (identifiers, CSS classes, dialog keys, log
   messages) — the snippet already filters common noise patterns, but always read the surrounding
   line before deciding it's user-facing.
3. **For each genuine hit**, determine the file's layer (Vue SFC / composable / Pinia store /
   domain-driven) and apply the matching pattern from "The Four Fix Patterns" above.
4. **Add the locale key** to both `en/gui.json` and `de/gui.json` following the naming convention,
   keeping the JSON files structurally in sync (same nesting, same key order).
5. **Replace the literal** at the call site with the `t(...)` lookup (or the shared constant, for
   layer 4).
6. **Re-run the detection snippet** on the touched file to confirm the finding is gone.
7. **Run the local gate**:
   ```powershell
   npm run test:logic
   npm run test:typescript
   npm run lint
   ```
   `gui.json` is plain JSON — a syntax slip (trailing comma, mismatched brace) fails silently in
   the app rather than at compile time, so also spot-check both locale files parse
   (`Get-Content ... | ConvertFrom-Json`) if you hand-edited them.

---

### Automation Snippet (Detection — Windows PowerShell)

Scans `src/` for likely hardcoded GUI strings across four categories: Vue template text nodes,
static/bound Vue attribute literals (`label`, `title`, `placeholder`, `hint`, `aria-label`, ...),
JS/TS object-literal properties (`title:`, `message:`, ...), and string literals passed to
alert/error calls (`alertService.feedback*`, `new Error(...)`, ...). Heuristic — always eyeball
the hits, don't blindly replace everything it prints.

```powershell
param(
    [switch]$IncludeTests = $false,
    [int]$MaxPerFile = 200
)

$ErrorActionPreference = "Stop"

function Is-ProbablyI18nKey([string]$s) {
    if (-not $s) { return $false }
    if ($s -match "^[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+){2,}$") { return $true }
    return $false
}

function Is-NoiseLiteral([string]$s) {
    if (-not $s) { return $true }
    $t = $s.Trim()
    if ($t.Length -lt 2) { return $true }
    if ($t -match "^\d+([.,]\d+)?$") { return $true }
    if ($t -cmatch "^[A-Z0-9_]{3,}$") { return $true }
    if ($t -match "^(https?:)?//") { return $true }
    if ($t -match "^[./]|^[A-Za-z]:\\") { return $true }
    if (Is-ProbablyI18nKey $t) { return $true }
    if ($t -cmatch "^[a-z_]+$" -and $t.Length -le 4) { return $true }
    if ($t -match "^[^A-Za-z0-9]+$") { return $true }
    return $false
}

function Add-Finding($findings, [string]$file, [int]$line, [string]$kind, [string]$text) {
    if (Is-NoiseLiteral $text) { return }
    $t = $text.Trim()
    if ($kind -eq "template-text") {
        if ($t -match "^[^\s<>=]+\s*=.*") { return }
        if ($t -match "^[^\s<>=]+\s*:\s*.*") { return }
        if ($t -match "^(?:[:@]|v-)") { return }
        if ($t -match "['""][^'""]+['""]") { return }
        if ($t.EndsWith(">")) { return }
        if ($t -match '^(?:\$?t|tm|rt)\(') { return }
        if ($t -match "^\s*\w+\(.*\)\s*$") { return }
        if ($t -match "=>") { return }
        if ($t -match "^[a-z][a-z0-9-]*$") { return }
    }
    if ($kind -eq "call-literal") {
        if ($t -match "^\[id\]$") { return }
        if ($t -match "^xx_") { return }
        if ($t -match "^[a-z][A-Za-z0-9]*$") { return }
        if ($t -match "^[A-Za-z0-9_]+$" -and $t.Length -le 20) { return }
    }
    $findings.Add([pscustomobject]@{
        file = $file
        line = $line
        kind = $kind
        text = $t
    }) | Out-Null
}

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$srcRoot = Join-Path $root "src"

$includeExt = @(".vue", ".ts", ".tsx", ".js", ".jsx")
$skipDirs = @(
    (Join-Path $root "node_modules"),
    (Join-Path $srcRoot "infra" "_locales"),
    (Join-Path $srcRoot "infra" "assets")
) | ForEach-Object { $_.TrimEnd('\', '/') + [System.IO.Path]::DirectorySeparatorChar }

$files = Get-ChildItem -Path $srcRoot -Recurse -File | Where-Object {
    if (-not ($includeExt -contains $_.Extension.ToLowerInvariant())) { return $false }
    foreach ($sd in $skipDirs) {
        if (($_.FullName + [System.IO.Path]::DirectorySeparatorChar).StartsWith($sd, [System.StringComparison]::OrdinalIgnoreCase)) { return $false }
    }
    if (-not $IncludeTests) {
        if ($_.Name -match "\.(test|spec)\.[^.]+$") { return $false }
    }
    return $true
}

$findings = New-Object System.Collections.Generic.List[object]

$reTemplateText = [regex]::new('>(?<txt>[^<>{}][^<]{1,120})<', "Compiled")

$attrNames = @(
    "label","title","placeholder","hint",
    "no-data-text","loading-text","items-per-page-text","aria-label"
)
$attrAlt = ($attrNames | ForEach-Object {[regex]::Escape($_)}) -join "|"
$reVueAttrStatic = [regex]::new(
    ('(?:^|(?<=\s))(?<name>' + $attrAlt + ')\s*=\s*(?:"(?<txt>[^"\r\n]{2,200})"|''(?<txt>[^''\r\n]{2,200})'')'),
    "IgnoreCase,Compiled"
)
$reVueAttrBoundString = [regex]::new(
    (':(?<name>' + $attrAlt + ')\s*=\s*(?:"\s*''(?<txt>[^''\r\n]{2,200})''\s*"|''\s*"(?<txt>[^"\r\n]{2,200})"\s*'')'),
    "IgnoreCase,Compiled"
)

$objPropNames = @(
    "label","title","subtitle","placeholder","hint","text","message",
    "noDataText","loadingText","itemsPerPageText","confirmText","cancelText","okText"
)
$objAlt = ($objPropNames | ForEach-Object {[regex]::Escape($_)}) -join "|"
$reObjPropLiteral = [regex]::new(
    ('(?<![\w$])(?<name>' + $objAlt + ')\s*:\s*(?:"(?<txt>[^"\r\n]{2,200})"|''(?<txt>[^''\r\n]{2,200})'')'),
    "IgnoreCase,Compiled"
)
$reObjPropFallbackLiteral = [regex]::new(
    ('(?<![\w$])(?<name>' + $objAlt + ')\s*:\s*[^\r\n]*?(?:\|\||\?\?)\s*(?:"(?<txt>[^"\r\n]{2,200})"|''(?<txt>[^''\r\n]{2,200})'')'),
    "IgnoreCase,Compiled"
)

$reCallLiteral = [regex]::new(
    '\(\s*(?:"(?<txt>[^"\r\n]{2,200})"|''(?<txt>[^''\r\n]{2,200})'')',
    "Compiled"
)

$reHasTranslate = [regex]::new('(?<!\w)(?:\$t|t|i18n\.t)\(', "Compiled")

foreach ($f in $files) {
    $lines = Get-Content -Path $f.FullName
    $perFile = 0
    $inTemplate = $false
    $templateIndent = -1

    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($perFile -ge $MaxPerFile) { break }
        $line = $lines[$i]

        if ($f.Extension -ieq ".vue") {
            if (-not $inTemplate -and $line -match "^\s*<template(\s|>)") {
                $inTemplate = $true
                $templateIndent = ($line -replace "^(\s*).*$", '$1').Length
            } elseif ($inTemplate -and $line -match "^\s*</template>") {
                $indent = ($line -replace "^(\s*).*$", '$1').Length
                if ($indent -eq $templateIndent) {
                    $inTemplate = $false
                    $templateIndent = -1
                }
            }
        }

        if ($line -match "^\s*(//|/\*|\*|import\s|export\s|const\s+log\s*=|log\(|console\.)") { continue }

        if ($f.Extension -ieq ".vue" -and $inTemplate) {
            foreach ($m in $reTemplateText.Matches($line)) {
                $txt = $m.Groups["txt"].Value
                if ($txt -match "{{|}}") { continue }
                if ($txt -match "^\s*&nbsp;\s*$") { continue }
                if ($txt -match "^\s*$") { continue }
                Add-Finding $findings (Resolve-Path $f.FullName).Path ($i + 1) "template-text" $txt
                $perFile++
                if ($perFile -ge $MaxPerFile) { break }
            }

            if ($perFile -lt $MaxPerFile) {
                $trim = $line.Trim()
                if ($trim.Length -gt 0 -and -not ($trim.StartsWith("<")) -and $trim -notmatch "{{|}}") {
                    if ($trim -match "^\s*&nbsp;\s*$") { continue }
                    Add-Finding $findings (Resolve-Path $f.FullName).Path ($i + 1) "template-text" $trim
                    $perFile++
                }
            }
        }

        if ($perFile -ge $MaxPerFile) { break }

        if ($f.Extension -ieq ".vue" -and $inTemplate) {
            foreach ($m in $reVueAttrStatic.Matches($line)) {
                $txt = $m.Groups["txt"].Value
                if ($reHasTranslate.IsMatch($line)) { continue }
                Add-Finding $findings (Resolve-Path $f.FullName).Path ($i + 1) "attr-static" $txt
                $perFile++
                if ($perFile -ge $MaxPerFile) { break }
            }
            if ($perFile -lt $MaxPerFile) {
                foreach ($m in $reVueAttrBoundString.Matches($line)) {
                    $txt = $m.Groups["txt"].Value
                    if ($reHasTranslate.IsMatch($line)) { continue }
                    Add-Finding $findings (Resolve-Path $f.FullName).Path ($i + 1) "attr-bound-string" $txt
                    $perFile++
                    if ($perFile -ge $MaxPerFile) { break }
                }
            }
        }

        if ($perFile -ge $MaxPerFile) { break }

        if (-not $reHasTranslate.IsMatch($line)) {
            foreach ($m in $reObjPropLiteral.Matches($line)) {
                $txt = $m.Groups["txt"].Value
                Add-Finding $findings (Resolve-Path $f.FullName).Path ($i + 1) "obj-prop" $txt
                $perFile++
                if ($perFile -ge $MaxPerFile) { break }
            }
            if ($perFile -lt $MaxPerFile) {
                foreach ($m in $reObjPropFallbackLiteral.Matches($line)) {
                    $txt = $m.Groups["txt"].Value
                    Add-Finding $findings (Resolve-Path $f.FullName).Path ($i + 1) "obj-prop-fallback" $txt
                    $perFile++
                    if ($perFile -ge $MaxPerFile) { break }
                }
            }
        }

        if ($perFile -ge $MaxPerFile) { break }

        if ($line -match "alertService\.feedback|feedback(?:Info|Error|Success|Warning)|showAlert\(|new\s+Error\(|throw\s+new\s+Error\(|reject\(new\s+Error\(" -and -not $reHasTranslate.IsMatch($line)) {
            foreach ($m in $reCallLiteral.Matches($line)) {
                $txt = $m.Groups["txt"].Value
                Add-Finding $findings (Resolve-Path $f.FullName).Path ($i + 1) "call-literal" $txt
                $perFile++
                if ($perFile -ge $MaxPerFile) { break }
            }
        }
    }
}

$findingsSorted = $findings | Sort-Object file,line,kind,text

Write-Host ("Files scanned: {0}" -f $files.Count)
Write-Host ("Findings: {0}" -f $findingsSorted.Count)
Write-Host ""

$grouped = $findingsSorted | Group-Object file
foreach ($g in $grouped) {
    Write-Host $g.Name
    foreach ($item in $g.Group) {
        $t = $item.text -replace "\s+", " "
        Write-Host ("  {0,5}  {1,-13}  {2}" -f $item.line, $item.kind, $t)
    }
    Write-Host ""
}
```

---

### Quality Checklist
- [ ] Every genuine finding either got a `t('...')` lookup (layers 1–3) or was extracted into a
      shared domain constant (layer 4) — none left as a bare literal.
- [ ] Every new locale key exists in **both** `en/gui.json` and `de/gui.json`, at the same nested
      position, with a real (not copy-pasted) German translation.
- [ ] Key naming mirrors the source file path and reuses existing namespaces where one already
      fits.
- [ ] No `useI18n()` call was added to a composable/function invoked outside Vue setup context, and
      no i18n dependency was added to `domain/**` or `adapters/driven/**`.
- [ ] `tests/unit/architecture.test.ts` still passes unmodified.
- [ ] `npm run test:logic`, `npm run test:typescript`, `npm run lint` all pass.
- [ ] Re-running the detection snippet against changed files shows the fixed lines gone.

---

### Tips
- The detection snippet is heuristic, not authoritative — it will surface some noise (dialog
  action ids, CSS-like tokens, code fragments) and can also miss multi-line template text. Read
  the surrounding code before fixing.
- Prefer reusing an existing `feedbackError` title/key over minting a new one when the message is
  generically "this operation failed" — see how `components.dialogs.forms.baseDialogForm.errorTitle`
  is reused as a catch-all dialog error title.
- When a fallback string appears in multiple files (e.g. `"Unknown error"`), extract one shared
  constant in `src/domain/errors.ts` rather than repeating the literal or wiring i18n into a layer
  that shouldn't have it.

---

### Maintenance
- Re-run this skill whenever a new Vue component/store/composable ships with user-facing text, or
  periodically as a sweep to catch strings added without i18n in mind.
- If a new architectural layer is introduced (e.g. a new adapter package), decide up front which
  fix pattern applies to it and add that decision here rather than re-deriving it ad hoc.