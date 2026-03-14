param(
    [switch]$IncludeTests = $false
)

$ErrorActionPreference = "Stop"

function Get-LeafKeyPaths {
    param(
        [Parameter(Mandatory = $true)]$Obj,
        [string]$Prefix = ""
    )

    if ($null -eq $Obj) {
        return @()
    }

    # Arrays and primitive values are treated as leaves.
    if (($Obj -is [string]) -or ($Obj -is [ValueType]) -or ($Obj -is [System.Collections.IList])) {
        if ($Prefix) { return @($Prefix) }
        return @()
    }

    $out = @()

    # Dictionaries (JavaScriptSerializer) and PSCustomObject (ConvertFrom-Json in newer PS versions).
    if ($Obj -is [System.Collections.IDictionary]) {
        foreach ($name in $Obj.Keys) {
            $value = $Obj[$name]
            $childPrefix = if ($Prefix) { "$Prefix.$name" } else { $name }
            $out += @(Get-LeafKeyPaths -Obj $value -Prefix $childPrefix)
        }
        return $out
    }

    foreach ($p in $Obj.PSObject.Properties) {
        $name = $p.Name
        $value = $p.Value
        $childPrefix = if ($Prefix) { "$Prefix.$name" } else { $name }
        $out += @(Get-LeafKeyPaths -Obj $value -Prefix $childPrefix)
    }

    return $out
}

function Load-GuiKeySet {
    param(
        [Parameter(Mandatory = $true)][string]$Path
    )
    $raw = Get-Content -Raw -Path $Path
    # PowerShell 5.1 ConvertFrom-Json has trouble with very deep objects; JavaScriptSerializer handles this well.
    Add-Type -AssemblyName System.Web.Extensions | Out-Null
    $ser = New-Object System.Web.Script.Serialization.JavaScriptSerializer
    $ser.MaxJsonLength = [int]::MaxValue
    $json = $ser.DeserializeObject($raw)
    $keys = Get-LeafKeyPaths -Obj $json
    $set = New-Object "System.Collections.Generic.HashSet[string]"
    foreach ($k in @($keys)) {
        if ($null -ne $k -and $k.ToString().Length -gt 0) {
            $set.Add($k.ToString()) | Out-Null
        }
    }
    return $set
}

function Add-KeyOccurrence {
    param(
        [Parameter(Mandatory = $true)][hashtable]$Occ,
        [Parameter(Mandatory = $true)][string]$Key,
        [Parameter(Mandatory = $true)][string]$Ref
    )

    if (-not $Occ.ContainsKey($Key)) {
        $Occ[$Key] = New-Object System.Collections.Generic.List[string]
    }
    $Occ[$Key].Add($Ref)
}

$root = (Resolve-Path ".").Path
$dePath = Join-Path $root "src/_locales/de/gui.json"
$enPath = Join-Path $root "src/_locales/en/gui.json"

if (-not (Test-Path $dePath)) { throw "Missing $dePath" }
if (-not (Test-Path $enPath)) { throw "Missing $enPath" }

$deKeys = Load-GuiKeySet -Path $dePath
$enKeys = Load-GuiKeySet -Path $enPath

# Extract from source files.
$occ = @{}
$usedKeys = [System.Collections.Generic.HashSet[string]]::new()

$includeExt = @(".ts", ".tsx", ".js", ".jsx", ".vue")
$skipDirs = @((Join-Path $root "src/_locales"), (Join-Path $root "src/assets"))

$files = Get-ChildItem -Path (Join-Path $root "src") -Recurse -File | Where-Object {
    $extOk = $includeExt -contains $_.Extension.ToLowerInvariant()
    if (-not $extOk) { return $false }

    foreach ($sd in $skipDirs) {
        if ($_.FullName.StartsWith($sd, [System.StringComparison]::OrdinalIgnoreCase)) { return $false }
    }

    if (-not $IncludeTests) {
        if ($_.Name -match "\.(test|spec)\.[^.]+$") { return $false }
    }

    return $true
}

# Capture $t("..."), t("..."), i18n.t("...")
$re = [regex]::new("(?<!\w)(?:\$t|t|i18n\.t)\(\s*(?<q>['""])(?<key>[^'""]+)\k<q>", "Compiled")

foreach ($f in $files) {
    $lines = Get-Content -Path $f.FullName
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        $m = $re.Matches($line)
        foreach ($mm in $m) {
            $key = $mm.Groups["key"].Value.Trim()
            if (-not $key) { continue }
            $usedKeys.Add($key) | Out-Null
            Add-KeyOccurrence -Occ $occ -Key $key -Ref ("{0}:{1}" -f (Resolve-Path $f.FullName).Path, ($i + 1))
        }
    }
}

# Also include translation keys from the TRANSLATION_KEYS map (these are not string literals at call sites).
$constantsPath = Join-Path $root "src/constants.ts"
if (Test-Path $constantsPath) {
    $constantsLines = Get-Content -Path $constantsPath
    $inMap = $false
    for ($i = 0; $i -lt $constantsLines.Count; $i++) {
        $line = $constantsLines[$i]
        if (-not $inMap -and $line -match "^\s*const\s+TRANSLATION_KEYS\s*=\s*{") {
            $inMap = $true
            continue
        }
        if ($inMap -and $line -match "^\s*}\s+as\s+const;") {
            $inMap = $false
            continue
        }
        if (-not $inMap) { continue }

        $mm = [regex]::Matches($line, ":\s*(?<q>['""])(?<key>[^'""]+)\k<q>")
        foreach ($m in $mm) {
            $key = $m.Groups["key"].Value.Trim()
            if (-not $key) { continue }
            $usedKeys.Add($key) | Out-Null
            Add-KeyOccurrence -Occ $occ -Key $key -Ref ("{0}:{1}" -f (Resolve-Path $constantsPath).Path, ($i + 1))
        }
    }
}

$usedList = @($usedKeys) | Sort-Object

$missingDe = @()
$missingEn = @()

foreach ($k in $usedList) {
    if (-not $deKeys.Contains($k)) { $missingDe += $k }
    if (-not $enKeys.Contains($k)) { $missingEn += $k }
}

function Print-Missing {
    param(
        [Parameter(Mandatory = $true)][string]$Title,
        [AllowEmptyCollection()][string[]]$Keys = @()
    )
    Write-Host ""
    Write-Host $Title
    Write-Host ("=" * $Title.Length)

    if ($Keys.Count -eq 0) {
        Write-Host "(none)"
        return
    }

    foreach ($k in ($Keys | Sort-Object)) {
        Write-Host ""
        Write-Host $k
        if ($occ.ContainsKey($k)) {
            $refs = $occ[$k] | Select-Object -Unique
            foreach ($r in $refs) {
                Write-Host ("  - {0}" -f $r)
            }
        }
    }
}

Write-Host ("Used keys: {0}" -f $usedKeys.Count)
Write-Host ("de/gui.json leaf keys: {0}" -f $deKeys.Count)
Write-Host ("en/gui.json leaf keys: {0}" -f $enKeys.Count)

Print-Missing -Title "Missing in de/gui.json" -Keys $missingDe
Print-Missing -Title "Missing in en/gui.json" -Keys $missingEn

# Parity check between locale files (keys present in one locale but not the other).
$deOnly = @()
$enOnly = @()

foreach ($k in @($deKeys)) {
    if (-not $enKeys.Contains($k)) { $deOnly += $k }
}
foreach ($k in @($enKeys)) {
    if (-not $deKeys.Contains($k)) { $enOnly += $k }
}

Print-Missing -Title "Present in de/gui.json but missing in en/gui.json" -Keys $deOnly
Print-Missing -Title "Present in en/gui.json but missing in de/gui.json" -Keys $enOnly
