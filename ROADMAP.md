# Roadmap & Pending Work — pm-utilities

What this repo is: a directory home plus two internal PM tools, deployed as one Vercel site with no
build step. `sbi-recon-evolution/` (1,665 lines) runs pandas in the browser via Pyodide and shows a
V1→V2 evolution story; `deeplinks-generator/` (1,235 lines) converts broker smallcase web URLs into
in-app deep links for SBI Securities and HDFC. Vanilla HTML/CSS/JS throughout.

Phases are meant to be executed in order — P0 → P5. Within a phase, items are independent.
The numbering is shared across all of Kartikeya's repos: **P0** stop the bleeding · **P1** tests/CI ·
**P2** truth in docs · **P3** polish · **P4** features · **P5** decision-gated.

_Last verified against the tree: 2026-07-29, after fetching origin (the local clone was 10 commits
behind and had never fetched). Current origin includes the smallcase → "Equity Portfolios and Basket
Investing" display-text rebrand, Axis broker support, and an MIT licence._

> ⚠️ **This repository is public, and that is a settled decision** (owner, 2026-07-30). Treat
> everything committed here — including this file — as published. Read Phase 0 before doing anything
> else in here, and never paste real identifiers or internal document text into any file in this repo.

---

## Phase 0 — Stop the bleeding

### 0.1 — Internal account IDs: code and history done; residual exposure accepted

**Status: the code and git history are clean. A residual exposure remains and has been accepted by
the owner.** Deliberately written without the retrieval details — this file is public, and an earlier
version of this section named the specific commit and the mechanism, which turned the backlog into a
how-to for the thing it was tracking.

**Done (2026-07-29)**
- The hardcoded list is gone from both the V1 and V2 recon blocks. The IDs are now **operator input**:
  an optional "Internal user IDs to exclude" field per version, parsed by a shared
  `readInternalIds()` and injected into Pyodide alongside the existing `files` variable. Nothing is
  persisted or transmitted, and an empty field is a valid run.
- Verified end to end in a browser against synthetic CSVs: with an ID entered, the matching
  missing-in-basket row flags `InternalUser=True`; with the field empty the same row is `False`;
  neither path errors. The placeholder example in the field is deliberately fake.
- **History rewritten** across all branch refs with `git filter-repo` and force-pushed. Every one of
  the 23 identifiers was then scanned for across every blob in the rewritten history: **none survive.**
  `main` is clean.

**Residual exposure — accepted, not open**
- A force-push rewrites branch refs. It does **not** reach objects that GitHub retains via the refs it
  keeps for merged pull requests, and there is no push, revert or repo-side command that removes
  those. This is a platform property, not a mistake in the rewrite.
- **Decision (owner, 2026-07-30): the repository stays public and this residual is accepted.** Not to
  be re-raised. Do not propose changing visibility again.
- If it is ever revisited, exactly two routes actually remove the retained objects: ask GitHub Support
  to purge them (a request draft was prepared for this), or delete and recreate the repository from
  the rewritten clone. Both are the owner's call.
- **The honest bottom line:** the repository was public throughout, so these identifiers should be
  treated as disclosed regardless of what git now says. Forks, clones, platform caches and
  third-party code-search indexes may retain them. If they matter operationally, the durable fix is
  retiring or rotating the identifiers — not scrubbing version control. That is the only remediation
  that does not depend on anyone else's cooperation.

**Guardrail for future work in this file**
- Do not paste real identifiers, account numbers or internal document text into this backlog, even to
  describe a problem. Reference `file:line` instead. A public backlog is published material.

### 0.2 — Unverified migration cleanup

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

- [ ] **`ENGINEERING.md` still documents the pre-consolidation repo** and would mislead anyone following it:
  - `:289` instructs `cp Deeplinks.html index.html` after every edit — a sync workflow that no longer applies, and following it would overwrite the live file with a legacy copy.
  - `:314` is a testing-checklist item requiring that `Deeplinks.html` and `index.html` be **identical**. They are no longer identical, and are not meant to be (see the verified non-issue below), so this checkbox can never be ticked truthfully.
  - `:350` describes a file structure including a `package.json` that this repo doesn't have.
  Either update these three to the current layout, or add a header marking the affected sections as historical.
- [ ] **The README claims accessibility work that is thin.** `README.md` lists "accessibility (ARIA labels, focus management, keyboard support, contrast)" as a demonstrated capability, but there are **5 `aria-` attributes in `sbi-recon-evolution/index.html` and 1 in `deeplinks-generator/index.html`**. Either do the work (P3) or soften the claim.

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
- [ ] Backport the external-`url` card capability from ai-experiments' `assets/home.js` (added in commit `0c10537` there), so this home can link out to tools that don't live in this repo. This repo's `home.js` predates that feature.

---

## Phase 5 — Decision-gated

- [x] **Should this repo be public? — DECIDED: stays public** (owner, 2026-07-30). Asked because this
  was the only repo in the portfolio that had held real internal identifiers, and the tools are
  explicitly internal utilities. The code and history have since been scrubbed, and the residual
  platform-side exposure described in 0.1 is accepted. **Settled — do not re-open.**
- [x] **Does the SBI/HDFC integration detail stay? — yes**, and it must: those strings are functional
  deep-link parameters, not secrets. See the verified non-issues below before touching them.

---

## Verified non-issues (do not re-investigate)

- **The `smallcase` strings still in `deeplinks-generator/index.html` are deliberate and must stay.** The rebrand (commit `f96e0c4`) changed **display text only**; `README.md:129` states the guardrail explicitly — never rename the broker identifiers or `/smallcase/` paths inside any URL, `sso_key`, or `sso_type`, and a find-and-replace on "smallcase" must skip them. These are functional integration parameters, not a branding oversight. `ENGINEERING.md` carries the same rule. **Do not "finish" the rebrand in that file.**
- **`sso_key` values and broker deep-link templates are not a leak.** They're integration parameters that a deep link is meant to carry, and constructing them is the tool's entire purpose. Documented deliberately, per the guardrail above.
- **`deeplinks-generator/reference/` is an intentional legacy folder, not accidental duplication.** It holds six preserved historical HTMLs and is documented at `README.md:129`. `reference/Deeplinks.html` is **no longer byte-identical** to `index.html` (md5 `3e64eadd…` vs `f74f575c…`), and is not meant to be — which is exactly why the `ENGINEERING.md:314` checklist item above is stale.
- **Axis broker support is built** (Equity + MTF, commits `996cf6e` / `ded54f2` / `dc6f427`). `ENGINEERING.md` §6's "adding a new broker" recipe reads like Axis is hypothetical; it isn't.
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
