# Roadmap & Pending Work — pm-utilities

What this repo is: a directory home plus two internal PM tools, deployed as one Vercel site with no
build step. `sbi-recon-evolution/` (1,665 lines) runs pandas in the browser via Pyodide and shows a
V1→V2 evolution story; `deeplinks-generator/` (1,235 lines) converts broker smallcase web URLs into
in-app deep links for SBI Securities and HDFC. Vanilla HTML/CSS/JS throughout.

Phases are meant to be executed in order — P0 → P5. Within a phase, items are independent.
The numbering is shared across all of Kartikeya's repos: **P0** stop the bleeding · **P1** tests/CI ·
**P2** truth in docs · **P3** polish · **P4** features · **P5** decision-gated.

_Last verified against the tree: 2026-07-29 · working tree clean, level with `origin/main` · 3 commits._

> ⚠️ **This repository is public** (verified via `gh repo view`). Read Phase 0 before doing anything
> else in here.

---

## Phase 0 — Stop the bleeding

### 0.1 — 23 real internal account IDs are in a public repo

- **Where:** `sbi-recon-evolution/index.html:729-734`, and **duplicated** at `:1511-1516` (the V1 and V2 copies of the recon block).
- **What:** a hardcoded `internaluserids = [REDACTED_ID, REDACTED_ID, REDACTED_ID, REDACTED_ID, …]` list — 23 real identifiers — used at `:735` and `:1517` to flag internal users out of the reconciliation:
  ```
  missinginsmallcase["InternalUser"] = missinginsmallcase.iloc[:,2].astype(str).isin([str(x) for x in internaluserids])
  ```
- **Why an edit is not enough:** these lines were introduced in commit **`d2e84c5` — the initial commit**. Deleting them from the working tree leaves them in history, reachable from the public repo forever.
- **Proposed sequence (needs your approval before anything is executed):**
  1. **Decide the destination first.** Either (a) make the repo private now and scrub at leisure — far cheaper and reversible — or (b) keep it public and rewrite history. Option (a) is the recommendation: it stops the exposure in one dashboard action rather than after a successful rewrite.
  2. **Scrub the code.** Replace both hardcoded blocks with an empty default plus a paste-in textarea ("internal user IDs to exclude, one per line"), or a git-ignored local config. The tool keeps working; the data stops shipping. Do this once and reference it from both V1 and V2 rather than duplicating it a third time.
  3. **Rewrite history** over the single affected file — `git filter-repo --path sbi-recon-evolution/index.html --replace-text <patterns>` — then force-push. Only 3 commits exist, so this is about as low-risk as a rewrite gets.
  4. **Confirm Vercel redeployed** the scrubbed tree, and that no preview deployment still serves the old bundle.
  5. **Treat the IDs as already exposed regardless.** GitHub caches rewritten commits, forks and archives survive a force-push, and the repo has been public since 7 July 2026. If these IDs are sensitive enough to matter, the rewrite reduces future exposure — it does not undo past exposure. That's a call for you, not a technical step.

### 0.2 — Production SSO keys and broker deep-link templates (lower risk, your judgement)

- **Where:** 15 references across `README.md:88-93`, `deeplinks-generator/ENGINEERING.md:66-71`, and `deeplinks-generator/index.html:1067` and `:1110` — including `sso_key=IR_SMALLCASE`, `IR_MTF_BASKET_SMALLCASE`, and the `hdfcsec.com/invest-right-2022?key=sso` template.
- **Assessment:** these are integration parameters, not credentials — a deep link is meant to be shareable, and the tool's entire purpose is to construct them. `README.md:64` already says the tool was "originally built for internal use at Smallcase". So this is disclosure of partner integration structure, not a secret leak.
- **Decision needed:** fine to leave, or scrub alongside 0.1 while you're in there. Lower urgency than 0.1 by a wide margin.

### 0.3 — Unverified migration cleanup

`MIGRATION.md:70-77` lists three manual steps with no record of completion:
- [ ] Import the consolidated repo into Vercel.
- [ ] Retire the standalone `sbi-recon-evolution` and `deeplinks-generator` Vercel projects, and archive those GitHub repos. **Both old repos still have stale local clones** at `~/workspace/sbi-recon-evolution` and `~/workspace/productmanager/Deeplinks` — delete them once the archive is confirmed, so there's one source of truth.
- [ ] Sanity-check one real deep link against a live broker app post-deploy.

---

## Phase 1 — Safety net (tests + CI)

- [ ] **No tests, no CI, no linting, no formatter.** Nothing guards two files totalling ~2,900 lines of inline JS and embedded Python.
- [ ] **Guard the V1/V2 duplication.** The entire Python recon block appears twice in `sbi-recon-evolution/index.html` (`~:729` and `~:1511`) because the page tells an evolution story. That's deliberate — but it means **every logic fix must be applied in two places**, and the internal-ID leak in 0.1 exists twice for exactly this reason. Cheapest guard: a CI check that extracts both blocks and asserts they differ *only* in the ways V2 is supposed to differ. Alternatively, hoist the shared parts into one `<script type="text/python">` referenced by both tabs.
- [ ] A link-checker over the built site would catch the class of bug that commit `1a9beec` fixed by hand (relative-asset resolution).

---

## Phase 2 — Truth in docs

- [ ] **A 45 KB file is shipped twice, and the docs claim it isn't.** `deeplinks-generator/index.html` is **byte-identical** to `deeplinks-generator/reference/Deeplinks.html` (md5 `876a311c4c00b37471f1704e85250435`, verified). `MIGRATION.md:25-30` says the manual-sync footgun was removed — the duplicate is still in the tree and still deployed. Delete `reference/Deeplinks.html`, or if it's kept deliberately as a historical artifact, say so in the README and exclude it from the deploy.
- [ ] **`ENGINEERING.md` now actively misleads.** It documents the pre-consolidation repo:
  - `:263-275` instructs `cp Deeplinks.html index.html` after every edit — a workflow that would *recreate* the duplication above.
  - `:278` references a `/Deeplinks.html` route that no longer exists.
  - `:283-296` is a testing checklist requiring that `Deeplinks.html` and `index.html` be identical.
  - `:323-336` describes a file structure including a `package.json` that this repo doesn't have.
  Either update it to the current layout or add a header marking it as a historical document.
- [ ] **The README claims accessibility work that is thin.** `README.md` lists "accessibility (ARIA labels, focus management, keyboard support, contrast)" as a demonstrated capability, but there are **5 `aria-` attributes in `sbi-recon-evolution/index.html` and 1 in `deeplinks-generator/index.html`**. Either do the work (P3) or soften the claim.
- [ ] `ENGINEERING.md` §6 documents a recipe for "adding a new broker (e.g. Axis + Axis MTF)" — reads as though Axis is supported. It isn't. Move it to Phase 4 as an explicit unbuilt item (done below).

---

## Phase 3 — Polish

- [ ] **Crawlers see the word "Showcase".** `index.html` ships `<title>Showcase</title>` with an empty `<meta name="description">`; `assets/home.js` rewrites both at runtime from `SITE.name`/`SITE.tagline`. Every crawler, link unfurler and no-JS visitor gets the generic placeholder. Fix: put the real title and description in the static HTML and let JS override rather than populate. **This affects pm-showcase and ai-experiments identically — the three `index.html` files are md5-identical.**
- [ ] No Open Graph / Twitter cards, no `apple-touch-icon`, no `robots.txt`, no `sitemap.xml`. Only `favicon.svg`.
- [ ] No security headers. `vercel.json` sets `cleanUrls`/`trailingSlash` and a `Cache-Control` for `/sbi-recon-evolution/`, but nothing else. (ai-experiments sets `X-Content-Type-Options: nosniff` — worth copying.)
- [ ] Accessibility pass on both tools, if the README claim in P2 is to be kept: real `aria-` labelling on the tool controls, focus management on tab switch, `aria-live` on results, visible focus rings, contrast check.
- [ ] Pyodide is a large CDN dependency loaded on page open — consider deferring it until a file is actually chosen, so the directory page stays fast.

---

## Phase 4 — Features

Carried over from `README.md`'s own "Future enhancements" list, plus one implied item:

- [ ] Excel (.xlsx) output instead of ZIP.
- [ ] Drag-and-drop file upload.
- [ ] Data preview before processing.
- [ ] Configurable key columns.
- [ ] Export reconciliation rules as JSON.
- [ ] Dark mode toggle.
- [ ] **Axis broker support** (Axis + Axis MTF) in the deep-links generator — `ENGINEERING.md` §6 documents the recipe for adding it but it was never built.
- [ ] Backport the external-`url` card capability from ai-experiments' `assets/home.js` (added in commit `0c10537` there), so this home can link out to tools that don't live in this repo. This repo's `home.js` predates that feature.

---

## Phase 5 — Decision-gated

- [ ] **Should this repo be public at all?** It is the only repo in the portfolio holding real internal identifiers, and the tools are explicitly internal smallcase utilities. With employment ending July 2026, the options are: keep public after scrubbing (it does demonstrate real Pyodide/pandas/browser work), make private, or archive. This decision changes how much of Phase 0 is needed — make it first.
- [ ] If it stays public: does the SBI/HDFC integration detail in 0.2 stay too?

---

## Verified non-issues (do not re-investigate)

- **The config-driven home really is config-driven.** `assets/home.js` reads `window.SITE` / `window.PROJECTS` and builds the head, header, count, grid and footer with no hardcoded project data; `index.html` ships empty mount points. Both tool slugs resolve to real folders — **no dead links**.
- **No TODO / FIXME / HACK markers** anywhere in the repo. Every gap above is silent.
- The `// not yet valid, but still typing → stay neutral` comment at `deeplinks-generator/index.html:940` is intentional UX behaviour, not an unfinished thought.

---

## Cross-repo note

`assets/home.css` is md5-identical across pm-utilities, pm-showcase and ai-experiments, and
`assets/home.js` is identical across the first two. **The shell is triplicated**, so every
improvement above has to be hand-copied three times. Worth extracting into a shared package or git
subtree before doing much more Phase 3 work — otherwise the meta-tag fix alone is three commits in
three repos.
