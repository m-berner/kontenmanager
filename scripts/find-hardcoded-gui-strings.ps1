param(
    [switch]$IncludeTests = $false,
    [int]$MaxPerFile = 200
)

$ErrorActionPreference = "Stop"

function Is-ProbablyI18nKey([string]$s) {
    if (-not $s) { return $false }
    # Typical vue-i18n dot paths
    if ($s -match "^[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+){2,}$") { return $true }
    return $false
}

function Is-NoiseLiteral([string]$s) {
    if (-not $s) { return $true }
    $t = $s.Trim()
    if ($t.Length -lt 2) { return $true }
    if ($t -match "^\d+([.,]\d+)?$") { return $true } # pure numbers
    if ($t -cmatch "^[A-Z0-9_]{3,}$") { return $true } # constants/ids (case-sensitive)
    if ($t -match "^(https?:)?//") { return $true }
    if ($t -match "^[./]|^[A-Za-z]:\\") { return $true } # paths
    if (Is-ProbablyI18nKey $t) { return $true }
    if ($t -cmatch "^[a-z_]+$" -and $t.Length -le 4) { return $true } # tiny tokens (case-sensitive)
    if ($t -match "^[^A-Za-z0-9]+$") { return $true } # punctuation only
    return $false
}

function Add-Finding($findings, [string]$file, [int]$line, [string]$kind, [string]$text) {
    if (Is-NoiseLiteral $text) { return }
    $t = $text.Trim()
    if ($kind -eq "template-text") {
        # Avoid multi-line tag attribute fragments and other non-text template lines.
        if ($t -match "^[^\\s<>=]+\\s*=.*") { return }            # looks like foo="bar"
        if ($t -match "^[^\\s<>=]+\\s*:\\s*.*") { return }        # looks like foo: bar
        if ($t -match "^(?:[:@]|v-)") { return }                  # :prop / @event / v-*
        if ($t -match "['""][^'""]+['""]") { return }             # contains quoted attr values
        if ($t.EndsWith(">")) { return }                          # tag line fragments like persistent>
        if ($t -match "^[\\w-]+>$") { return }                    # trailing tag close fragment
        if ($t -match '^(?:\$?t|tm|rt)\(') { return }            # translation calls
        if ($t -match "^\s*\w+\\(.*\\)\s*$") { return }           # looks like a function call
        if ($t -match "=>") { return }                            # arrow functions / expressions
        if ($t -match "^[a-z][a-z0-9-]*$") { return }             # kebab-case attribute-like tokens
    }
    if ($kind -eq "call-literal") {
        # Avoid identifiers / dialog IDs and similar non-UI strings.
        if ($t -match "^\[id\]$") { return }
        if ($t -match "^xx_") { return }                          # browserService message keys, not gui.json
        if ($t -match "^[a-z][A-Za-z0-9]*$") { return }           # camelCase ids like addStock
        if ($t -match "^[A-Za-z0-9_]+$" -and $t.Length -le 20) { return } # short tokens
    }
    $findings.Add([pscustomobject]@{
        file = $file
        line = $line
        kind = $kind
        text = $t
    }) | Out-Null
}

$root = (Resolve-Path ".").Path
$srcRoot = Join-Path $root "src"

$includeExt = @(".vue", ".ts", ".tsx", ".js", ".jsx")
$skipDirs = @(
    (Join-Path $root "node_modules"),
    (Join-Path $srcRoot "_locales"),
    (Join-Path $srcRoot "assets")
)

$files = Get-ChildItem -Path $srcRoot -Recurse -File | Where-Object {
    if (-not ($includeExt -contains $_.Extension.ToLowerInvariant())) { return $false }
    foreach ($sd in $skipDirs) {
        if ($_.FullName.StartsWith($sd, [System.StringComparison]::OrdinalIgnoreCase)) { return $false }
    }
    if (-not $IncludeTests) {
        if ($_.Name -match "\.(test|spec)\.[^.]+$") { return $false }
    }
    return $true
}

$findings = New-Object System.Collections.Generic.List[object]

# Heuristics:
# 1) Vue template text nodes (only inside <template> blocks):
#    a) inline: >TEXT<
#    b) standalone text line between tags.
$reTemplateText = [regex]::new('>(?<txt>[^<>{}][^<]{1,120})<', "Compiled")

# 2) Common Vuetify/Vue props that are likely user-facing.
# Only treat template attributes as literals when they are genuinely static, e.g.:
#   label="Foo"
#   aria-label="Open menu"
# Also support the common Vue pattern: :label="'Foo'".
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

# 3) JS/TS object literal properties that are likely user-facing:
#   { title: "..." }
#   { message: "..." }
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

# JS/TS string literals in calls: foo("bar"), foo('bar')
$reCallLiteral = [regex]::new(
    '\(\s*(?:"(?<txt>[^"\r\n]{2,200})"|''(?<txt>[^''\r\n]{2,200})'')',
    "Compiled"
)

# Exclude lines that already call t("...") or $t("...") or i18n.t("...") around the literal.
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
                # Only close when the indentation matches the root <template> tag, so nested <template> blocks
                # (e.g. v-slot templates) don't terminate scanning early.
                if ($indent -eq $templateIndent) {
                    $inTemplate = $false
                    $templateIndent = -1
                }
            }
        }

        # Skip obvious non-UI noise lines.
        if ($line -match "^\s*(//|/\*|\*|import\s|export\s|const\s+log\s*=|log\(|console\.)") { continue }

        # 1) Vue template text nodes (only in .vue files)
        if ($f.Extension -ieq ".vue" -and $inTemplate) {
            foreach ($m in $reTemplateText.Matches($line)) {
                $txt = $m.Groups["txt"].Value
                # Filter out mustache/interpolation heavy fragments.
                if ($txt -match "{{|}}") { continue }
                # Filter out layout-only entities.
                if ($txt -match "^\s*&nbsp;\s*$") { continue }
                if ($txt -match "^\s*$") { continue }
                Add-Finding $findings (Resolve-Path $f.FullName).Path ($i + 1) "template-text" $txt
                $perFile++
                if ($perFile -ge $MaxPerFile) { break }
            }

            if ($perFile -lt $MaxPerFile) {
                $trim = $line.Trim()
                # Standalone text line between tags (no markup, no interpolation).
                if ($trim.Length -gt 0 -and -not ($trim.StartsWith("<")) -and $trim -notmatch "{{|}}") {
                    if ($trim -match "^\s*&nbsp;\s*$") { continue }
                    Add-Finding $findings (Resolve-Path $f.FullName).Path ($i + 1) "template-text" $trim
                    $perFile++
                }
            }
        }

        if ($perFile -ge $MaxPerFile) { break }

        # 2) Vue attribute literals likely shown to users.
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

        # 3) JS/TS object property literals that may be surfaced (config objects, dialog params, etc).
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

        # 4) JS/TS call literals that may be surfaced to the user (alerts/errors).
        # Keep this narrow to avoid catching dialog IDs like openDialog("addStock").
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
        # Keep output reasonably greppable.
        $t = $item.text -replace "\s+", " "
        Write-Host ("  {0,5}  {1,-13}  {2}" -f $item.line, $item.kind, $t)
    }
    Write-Host ""
}
