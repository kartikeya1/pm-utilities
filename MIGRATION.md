# Migration Record - pm-utilities

## Summary

`pm-utilities` consolidates two standalone PM-tool repos into one Vercel site with a config-driven
home page and per-tool routes.

| Source repo | Original commits | Now at route |
|---|---|---|
| `kartikeya1/sbi-recon-evolution` | `0b9e2c2` (Initial commit) | `/sbi-recon-evolution` |
| `kartikeya1/deeplinks-generator` | `2fa1a39` (Revamp UI + fix validation), `2047e10` (index entry point), `9b70a9c` (Initial commit) | `/deeplinks-generator` |

**Approach:** each app's `index.html` was copied **byte-for-byte** into a route folder (verified
identical). Deep-link generator business logic is therefore **unchanged**. A shared config-driven
home framework was added. Fresh git history; original commit hashes recorded above.

**Structural change (deliberate, no behaviour change):** the deeplinks repo previously kept
`index.html` and `Deeplinks.html` as manually-synced duplicates. In pm-utilities, `index.html` is
the single canonical app; the former duplicate + 3 legacy/reference HTMLs moved to
`deeplinks-generator/reference/` (reference-only). This removes the sync footgun without changing
the deployed app. See `deeplinks-generator/ENGINEERING.md` (verbatim original engineering doc + note).

**Not migrated:** `.env.local` (auto-generated **Vercel OIDC token** - a secret; gitignored),
`.vercel/`, `package.json` scripts (just a local `http.server` alias; superseded by this README).

## Documentation mapping

| Original repo → section | New location |
|---|---|
| **sbi-recon README** - The Story (V1/V2) | README → SBI Reconciliation → V1/V2 |
| sbi-recon README - Features (CSV combining, reconciliation, 6 reports) | README → SBI → Features |
| sbi-recon README - Tech Stack | README → Tech (+ SBI section) |
| sbi-recon README - How to Run Locally | README → Development |
| sbi-recon README - Architecture (single file, two designs) | README → SBI → Architecture & design system |
| sbi-recon README - Design System (V2) | README → SBI → Architecture & design system (tokens) |
| sbi-recon README - Portfolio Value | README → SBI → Portfolio value |
| sbi-recon README - Future Enhancements | README → SBI → Future enhancements |
| sbi-recon README - Author / License | README (author preserved in prose); MIT retained |
| **deeplinks README** - entire "for the next engineer" guide | `deeplinks-generator/ENGINEERING.md` (**verbatim** + migration note) |
| deeplinks README - What the tool does + output formats table | README → Deep Links Generator (summary + table) |
| deeplinks README - Golden rules | README → callout + ENGINEERING.md §1 |
| deeplinks README - Add-a-broker recipe / ID convention / testing | ENGINEERING.md §5,§6,§8 (verbatim) |
| deeplinks README - File structure / sync notes | ENGINEERING.md (verbatim) + this file's Structural change note |
| deeplinks - legacy/reference HTMLs | `deeplinks-generator/reference/` (+ its README) |

**Nothing dropped.** New material: shared Architecture + "Adding a future utility" guide.

## Validation report

**Routes** (all served locally, HTTP 200):

| Route | Status | Notes |
|---|---|---|
| `/` | ✅ 200 | Home renders 2 cards from config; accent `#1d4ed8` |
| `/sbi-recon-evolution/` | ✅ 200 | Pyodide `<script>` present; V1/V2 content; 4 file inputs |
| `/deeplinks-generator/` | ✅ 200 | All 5 generators present and callable |

| Check | Result |
|---|---|
| App files vs originals | ✅ **byte-identical** (`diff` clean) |
| Deep-link business logic | ✅ `loadHDFCIRSample(); generateHDFCIR()` produced the exact `extra_param` JSON shape (`path`, `utm_*`, `add_params:true`) - unchanged from production |
| Generators present | ✅ `generateSBIEQ`, `generateSBIMTF`, `generateHDFCIR`, `generateHDFCMTF`, `generateHDFCSky` |
| Home cards config-driven | ✅ 2 cards, correct routes/chips |
| Assets resolve | ✅ no failed requests (Pyodide from CDN) |
| Console errors | ✅ none |
| Secrets committed | ✅ none (OIDC token excluded) |

## Manual steps for you

1. Import `pm-utilities` into Vercel (preset **Other**, no build, output = root).
2. Retire the old **sbi-recon-evolution** and **deeplinks-generator** Vercel projects and archive
   those GitHub repos (commands in the top-level consolidation report).
3. Sanity-check one real deep link post-deploy (e.g. `loadHDFCIRSample(); generateHDFCIR()` in the
   console) against a known-good production link, per ENGINEERING.md §8.
