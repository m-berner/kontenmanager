---
name: fix-sequence-diagrams
description: Find and fix mermaid `sequenceDiagram` blocks in doc (.md) files that are syntactically broken or have drifted from the code/prose they illustrate. Use after a refactor touches a file named in one of these diagrams, when update-documentation flags a stale usecase doc, or periodically as a sweep.
---

### Skill: Fix Sequence Diagrams

#### Purpose
Every usecase walkthrough in `src/app/usecases/docs/*.md` ends with a mermaid `sequenceDiagram`
block that is meant to be the visual twin of that same file's "Step by step" prose section — see
`src/app/usecases/docs/add-booking.md` for the canonical example. These diagrams drift for two
independent reasons and this skill fixes both:

1. **Syntax breakage** — an `alt`/`loop`/`opt` without its matching `end`, a message that
   references a participant alias that was never declared, a typo'd arrow.
2. **Fidelity drift** — the diagram still parses fine, but no longer matches the current code (a
   step was renamed/reordered/removed, a new guard was added to the usecase, a conditional branch
   changed) or no longer matches the prose sitting right above it in the same file.

`update-documentation` catches stale prose and dangling links; it does not read or fix mermaid
diagrams. This skill is the dedicated pass for that one artifact type.

#### When to Use
- After a refactor changes a call chain that one of these diagrams depicts: a renamed/moved file,
  a reordered or new guard, a new conditional branch, a changed method signature.
- When `update-documentation` (or a human reviewer) flags a usecase doc as stale but the fix is in
  the diagram specifically, not the prose.
- Periodically, as a standalone sweep — diagrams don't show up in `npm run lint` or `test:unit`
  failures, so nothing else in the local gate catches this kind of drift.

---

### Scope
`src/app/usecases/docs/*.md` — currently the only `.md` files in the repo containing a
`sequenceDiagram` block (verified via `grep -rl sequenceDiagram --include=*.md`, 19 files). Don't
trust that count as permanent: re-run the same grep at the start of a round in case a new doc
elsewhere has grown one. Everything else under `src/**/README.md` currently has none.

---

### Two Failure Modes, Checked Separately

**1. Syntax validity** — the fenced block must be a well-formed mermaid sequence diagram:
- Every `alt` / `opt` / `loop` / `par` / `critical` / `rect` / `box` has a matching `end`, and
  they nest correctly (a stack of open blocks, not just a matching count).
- Every alias appearing on either side of a message arrow was declared earlier via
  `participant XX as ...` or `actor XX as ...`. A typo'd alias silently renders as a brand-new,
  undeclared participant in mermaid rather than erroring — easy to miss by eye.
- No alias is declared twice with two different `as` labels.
- Arrow tokens are one of the forms actually used in this repo: `->>` (call), `-->>` (return /
  reactive change), `-x`/`--x` (rare, message loss) — not a stray `->` or `-->` left over from a
  copy-paste (those render as lines with no arrowhead, which is never intentional here).
- **No bare `;` inside a message label.** Confirmed the hard way: mermaid's sequence-diagram
  grammar treats `;` as an alternate statement separator, so `A->>B: doX(); doY()` parses as two
  statements — `A->>B: doX()` followed by a bare `doY()` with no arrow — and fails with a
  `Parse error ... got 'NEWLINE'` pointing at the *next* line, not the semicolon itself. The
  PowerShell structural snippet below does **not** catch this (it doesn't model mermaid's grammar,
  only block-nesting and alias declarations), so a clean snippet run is not proof a message line is
  safe. When one call site logically does two things, write two separate arrow lines instead of
  joining them with `;` on one.
- **When you have any doubt syntax alone will resolve it, validate against mermaid's real parser**,
  not just the heuristic snippet — see "Ground-Truth Validation" below. This is how the `;` gotcha
  above was actually found; the heuristic snippet had reported the file clean.

**2. Fidelity to code and prose** — for each diagram:
- Read the same file's "Quick file map" table and numbered "Step by step" prose — that prose is
  the ground truth the diagram was originally derived from. Every meaningful prose step should
  have a corresponding diagram message, and vice versa. A step present in one but not the other is
  a drift signal, not necessarily proof of which side is wrong — check the actual source next.
- Open every file the diagram names as a participant and confirm the call chain, argument shape,
  guard order, and conditional branches (`alt`/`loop` blocks) still match what's on screen. Grep
  for the method names used in message labels (e.g. `submitGuard(`, `addBookingUsecase(`) to catch
  a rename the diagram never picked up.
- If the prose and the diagram both still match the code, leave it alone even if the wording looks
  improvable — this skill fixes drift and breakage, it does not do a style pass on already-correct
  diagrams.

---

### Diagram Conventions Used In This Repo
Match these when adding or correcting lines — don't introduce a new style mid-file:
- `actor U as User` — always the first declaration, only for the human.
- `participant XX as <File.vue | module.ts | "X store">` — one per file/module the diagram
  actually references, a short 2-4 letter uppercase alias unique within that diagram (never reuse
  an alias for two different participants), ordered roughly by the file map's layer order
  (entry point → dialog → form → guard → mapper → usecase → repository → DB → store).
- `->>` solid arrow — a synchronous call or a user action (`U->>HB: click "..."`).
- `-->>` dashed arrow — a return value or a reactive/computed state change that isn't a direct
  call (`RT-->>DP: dialogName/dialogVisibility change`).
- `XX->>XX: ...` self-message — an in-object guard or internal computation step, not a call to
  another participant.
- `alt <condition> ... else ... end` — branches; `loop <condition-or-range> ... end` — loops.
  Phrase the condition the same way the prose describes it.
- `Note over XX: ...` — an out-of-band detail (a timer, a de-dupe window, an async side effect)
  that doesn't fit naturally on an arrow.
- Message labels are short and call-shaped (`mapBookingFormToDb(accountId, today, bookingTypes)`),
  matching the vocabulary the prose already uses for that step — not a prose paraphrase.

---

### Update Playbook (Step-by-Step)

1. **Enumerate targets.** Re-run the scope grep (below) rather than trusting a stale file list.
2. **Run the structural syntax snippet** across all target files to catch unbalanced blocks and
   undeclared-alias references first — cheap, and narrows where to look closely.
3. For each file with a finding, or each file due for a fidelity check:
   a. Read the "Quick file map" table and "Step by step" prose in the same doc.
   b. Read the diagram itself.
   c. Open every participant's actual source file and confirm the call chain still matches —
      don't just trust the prose, since the prose can be stale in exactly the same way the diagram
      can (both are hand-written and both can rot).
   d. List concrete mismatches: a message that no longer matches the code, a missing/extra step, a
      branch (`alt`) whose condition changed, a renamed method.
4. **Fix the mermaid block** with Edit — touch only what's wrong; preserve the surrounding
   convention (alias names, arrow styles) for anything that's still correct.
5. **Re-run the structural snippet** on the touched file to confirm it still parses.
6. If the prose itself was what had drifted (rare — the prose is usually the more-recently-hand-
   verified side), fix that too in the same pass; note it in your summary since that overlaps with
   `update-documentation`'s territory.
7. No project-wide test/lint gate covers markdown content — there's nothing to run afterward
   beyond re-reading the diff. If you also touched prose text or links, `update-documentation`'s
   own broken-link check is worth a quick manual look.

---

### Structural Syntax Snippet (Windows PowerShell)

Extracts every ` ```mermaid ` sequence-diagram block from the target `.md` files and checks
`alt`/`opt`/`loop`/`par`/`critical`/`rect`/`box` nesting and undeclared-participant references.
Heuristic, not a real mermaid parser — it will not catch every possible syntax error, and a clean
report is not a substitute for actually reading the diagram against the code.

```powershell
$ErrorActionPreference = "Stop"

$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$files = Get-ChildItem -Path (Join-Path $root "src") -Recurse -Filter "*.md" |
    Where-Object { (Get-Content $_.FullName -Raw) -match "sequenceDiagram" }

$openKeywords = @("alt", "opt", "loop", "par", "critical", "rect", "box")
$reBlockLine = [regex]::new('^\s*(?<kw>alt|opt|loop|par|critical|rect|box)\b')
$reElseLine  = [regex]::new('^\s*(?:else|and|option)\b')
$reEndLine   = [regex]::new('^\s*end\s*$')
$reDecl      = [regex]::new('^\s*(?:actor|participant)\s+(?<alias>\w+)\s+as\s+')
$reMsg       = [regex]::new('^\s*(?<a>\w+)\s*(?:-->>|->>|--x|-x|-->|->)\s*(?<b>\w+)\s*:')

$totalBlocks = 0
$totalFindings = 0

foreach ($f in $files) {
    $lines = Get-Content -Path $f.FullName
    $inBlock = $false
    $declared = New-Object System.Collections.Generic.HashSet[string]
    $stack = New-Object System.Collections.Generic.Stack[string]
    $blockStartLine = 0
    $fileFindings = New-Object System.Collections.Generic.List[string]

    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        $lineNo = $i + 1

        if (-not $inBlock -and $line -match '^\s*```mermaid\s*$') {
            $inBlock = $true
            $blockStartLine = $lineNo
            $declared.Clear()
            $stack.Clear()
            $totalBlocks++
            continue
        }
        if ($inBlock -and $line -match '^\s*```\s*$') {
            if ($stack.Count -gt 0) {
                $fileFindings.Add("  line $blockStartLine-$lineNo : unclosed block(s): $($stack.ToArray() -join ', ')")
            }
            $inBlock = $false
            continue
        }
        if (-not $inBlock) { continue }

        if ($line -match '^\s*sequenceDiagram\s*$') { continue }

        $mDecl = $reDecl.Match($line)
        if ($mDecl.Success) {
            $alias = $mDecl.Groups["alias"].Value
            if ($declared.Contains($alias)) {
                $fileFindings.Add("  line $lineNo : alias '$alias' declared twice")
            }
            [void]$declared.Add($alias)
            continue
        }

        $mBlock = $reBlockLine.Match($line)
        if ($mBlock.Success) {
            $stack.Push($mBlock.Groups["kw"].Value)
            continue
        }
        if ($reEndLine.IsMatch($line)) {
            if ($stack.Count -eq 0) {
                $fileFindings.Add("  line $lineNo : stray 'end' with no open block")
            } else {
                [void]$stack.Pop()
            }
            continue
        }
        if ($reElseLine.IsMatch($line)) { continue }

        $mMsg = $reMsg.Match($line)
        if ($mMsg.Success) {
            $a = $mMsg.Groups["a"].Value
            $b = $mMsg.Groups["b"].Value
            if (-not $declared.Contains($a)) {
                $fileFindings.Add("  line $lineNo : undeclared participant '$a' (left side)")
            }
            if (-not $declared.Contains($b)) {
                $fileFindings.Add("  line $lineNo : undeclared participant '$b' (right side)")
            }
            $label = $line.Substring($mMsg.Index + $mMsg.Length)
            if ($label -match ';') {
                $fileFindings.Add("  line $lineNo : ';' inside a message label — mermaid treats it as a statement separator and will fail to parse; use two arrow lines instead")
            }
        }
    }

    if ($fileFindings.Count -gt 0) {
        Write-Host $f.FullName.Substring($root.Length + 1)
        foreach ($line in $fileFindings) { Write-Host $line }
        Write-Host ""
        $totalFindings += $fileFindings.Count
    }
}

Write-Host ("Blocks scanned: {0}" -f $totalBlocks)
Write-Host ("Findings: {0}" -f $totalFindings)
```

---

### Ground-Truth Validation (Real Mermaid Parser)

The structural snippet above is a heuristic over mermaid's grammar, not mermaid's actual grammar —
it missed a real parse-breaking bug (the `;`-in-a-message-label gotcha above) that only surfaced by
running the diagram through mermaid's own parser. When a diagram still looks wrong after the
snippet and a fidelity re-read come back clean, or after any nontrivial edit to a diagram, validate
it for real instead of continuing to eyeball it:

```bash
mkdir -p /tmp/mmvalidate && cd /tmp/mmvalidate
npm init -y >/dev/null 2>&1
npm install mermaid jsdom --no-audit --no-fund

cat > validate.mjs << 'EOF'
import { JSDOM } from "jsdom";
import fs from "fs";

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", { pretendToBeVisual: true });
global.window = dom.window;
global.document = dom.window.document;
global.SVGElement = dom.window.SVGElement || class {};
global.HTMLElement = dom.window.HTMLElement;
global.DOMPurify = { sanitize: (s) => s };
// Do NOT set global.navigator — Node 22+ already defines it as a getter-only
// property, and assigning to it throws before mermaid is even imported.

const mermaid = (await import("mermaid/dist/mermaid.esm.mjs")).default;
mermaid.initialize({ startOnLoad: false });

const src = fs.readFileSync(process.argv[2], "utf8");
try {
    await mermaid.parse(src, { suppressErrors: false });
    console.log("PARSE OK");
} catch (err) {
    console.log("PARSE ERROR:", err.message);
}
EOF

node validate.mjs path/to/extracted-diagram.mmd
```

Extract just the fenced block's contents (the lines between ` ```mermaid ` and the closing
` ``` `, not the fences themselves) into the `.mmd` file passed as the argument. `mermaid.parse`
rejects on any real grammar violation with a `Parse error on line N: ...` message naming the exact
line and the tokens it expected — far more precise than guessing from a rendering glitch. Loop this
over every diagram in scope (one `.mmd` file per doc) when doing a full sweep, not just the one
file someone flagged, since a grammar mistake like the `;` gotcha can be copy-pasted into more than
one diagram. This needs network access for the one-time `npm install` into a scratch dir — it does
not touch the project's own `package.json` or `node_modules`, and the scratch dir can be discarded
afterward.

---

### Quality Checklist
- [ ] Every `alt`/`opt`/`loop`/`par`/`critical`/`rect`/`box` in every touched diagram has a
      matching `end`, correctly nested.
- [ ] Every alias used in a message was declared via `participant`/`actor`, and no alias is
      declared twice with conflicting labels.
- [ ] Every message in the diagram corresponds to a real call in the current source of the file it
      names — checked by reading that file, not just trusting the prose above the diagram.
- [ ] The diagram and the "Step by step" prose in the same doc tell the same story — no step in
      one that's silently missing from the other.
- [ ] Arrow style matches convention (`->>` calls, `-->>` returns/reactive changes) and wasn't
      left as a bare `->`/`-->` from a copy-paste.
- [ ] Participant aliases are short, unique within the diagram, and ordered roughly by layer —
      **and roughly by first-use order too**: a participant declared far from where its only usage
      sits forces every message in between to visually cross its lane. Reordering a diagram's
      `participant`/`actor` list changes only rendering layout, never its meaning, so this is
      always safe to fix.
- [ ] No message label contains a bare `;` (see the syntax-validity bullet above) — split into two
      arrow lines instead.
- [ ] Any diagram that was nontrivially edited (not just re-read) was validated against a real
      mermaid parser (see "Ground-Truth Validation"), not just the heuristic snippet.
- [ ] Nothing was changed in a diagram that was already correct — this is a drift/breakage fix,
      not a rewrite pass.

---

### Tips
- The structural snippet is heuristic — it does not understand mermaid's full grammar (e.g.
  `activate`/`deactivate`, `Note left of X,Y:` spanning two aliases, or that `;` splits a
  statement). Read the raw diagram yourself before concluding a clean snippet run means the
  diagram is correct; it only means the cheap structural checks passed. When a user reports a
  diagram "not working"/"looks corrupted" after the snippet already came back clean, that is the
  signal to stop re-reading it by eye and reach for the real parser instead — that is exactly how
  the `;` gotcha above was actually caught, after a first (wrong) guess that the problem was only
  participant-ordering/layout.
- When the prose and the diagram disagree, check the actual code before "fixing" either one — the
  round-43 audit-memory lesson applies here too: a document can assert something false with
  complete confidence, so the source file is the only real tie-breaker.
- Prefer the smallest edit that restores fidelity — reordering, adding, or removing individual
  message lines — over regenerating an entire diagram from scratch, so an unrelated but still-
  correct message doesn't get needlessly reworded in the diff.

---

### Maintenance
- Re-run the scope grep each time this skill starts; if a `sequenceDiagram` block ever appears
  outside `src/app/usecases/docs/`, fold that location into scope here rather than re-deriving it
  ad hoc next time.
- If this repo ever adds real mermaid-parsing tooling (a `markdownlint`/`mermaid-cli` dependency),
  prefer running that over the PowerShell structural snippet and note the change here.
