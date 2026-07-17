> **Migration note (pm-utilities).** This document is the original engineering README from the
> standalone `deeplinks-generator` repo, preserved **verbatim** below. Two things changed when the
> tool moved into the `pm-utilities` showcase:
>
> 1. The served app is **`deeplinks-generator/index.html`** (route `/deeplinks-generator`). The
>    old "`index.html` and `Deeplinks.html` are duplicates, keep them in sync" footgun (§3, §7) is
>    **gone** — `index.html` is now the single canonical app. The former duplicate `Deeplinks.html`
>    and the three legacy/reference HTMLs now live under **`reference/`** (reference-only; not
>    routed, not part of the app).
> 2. Deployment is via the parent `pm-utilities` repo (see its top-level README), not a per-tool
>    Vercel project.
>
> Everything else below — the golden rules, the generator business logic, the ID naming
> convention, the add-a-broker recipe, and the testing checklist — is unchanged and authoritative.
>
> ---

# Equity Portfolios and Basket Investing Deep Links Generator

A single-file web tool that converts a broker's **Equity Portfolios and Basket Investing web URL** into a
**ready-to-use in-app deep link**. It currently supports **SBI Securities**
(Equity, MTF), **HDFC** (IR, MTF, HDFC Sky) and **Axis** (Equity, MTF).

> **This README is written for the next engineer or AI who edits this tool.**
> The most likely next task is **adding a new broker** — there is a complete
> step-by-step recipe for that below (§6), written around Axis as the example.
> Axis has since been implemented, so §6 doubles as a worked reference: compare
> it against the `generateAxisEQ` / `generateAxisMTF` functions in the code.
> Read the "Golden rules" section first; it will save you from breaking things.

---

## 1. Golden rules (read before editing)

1. **Do NOT change the link-generation business logic.** The URL templates,
   encoding schemes, JSON shapes and `sso_key` values inside the `generate*()`
   functions are **verified correct in production**. Restyle freely; never touch
   what a `generate*()` function *outputs*.
2. **Element IDs are an API.** Browsers expose any element with `id="x"` as a
   global JS variable `x`. The generators rely on this (e.g. `sbiEqInput`,
   `sbieqBadge`). **Renaming an ID will silently break generation.** If you add
   fields, follow the existing naming convention (below).
3. **`Deeplinks.html` and `index.html` are duplicates.** `index.html` is what
   Vercel serves at the root URL; `Deeplinks.html` is the working/canonical
   copy. **After any edit you must copy one to the other** (see §7). If they
   drift apart, the deployed site won't match what you edited.
4. **Keep it a single self-contained file.** No external CSS/JS/fonts/images —
   everything is inlined so it works offline and on any static host.

---

## 2. What the tool does (conceptually)

Every broker follows the same 3-step shape inside its `generate*()` function:

1. **Validate** the pasted URL starts with the broker's expected domain
   (the `validate()` gate). If not → show error, stop.
2. **Split** the URL into `base` and `query`: `const [b, p] = value.split("?")`,
   then derive `path = new URL(b).pathname + hash`.
3. **Assemble** the broker-specific deep link string from `path` and (for HDFC
   IR/MTF) the UTM fields.

The differences between brokers are only in step 3 (the output format) and the
domain string in step 1.

### Current output formats (for reference — do not modify)

| Product   | `sso_key` / route                    | Encoding of path/params |
|-----------|--------------------------------------|-------------------------|
| SBI EQ    | `mobile.sbisecurities.in/invest`     | **base64** of `encodeURIComponent` |
| SBI MTF   | `mobile.sbisecurities.in/dashboard`  | **base64** of `encodeURIComponent` |
| HDFC IR   | `sso_key=IR_SMALLCASE`               | **JSON → `encodeURIComponent`** into `extra_param` |
| HDFC MTF  | `sso_key=IR_MTF_BASKET_SMALLCASE`    | **JSON → `encodeURIComponent`** into `extra_param` |
| HDFC Sky  | `hdfcsky.com/sky/hdfc-small-case`    | plain `encodeURIComponent` |
| Axis EQ   | `invest-preprod.axisdirect.in/sso?sso_type=EQUITY_SMALLCASE` | plain `encodeURIComponent` of path; `?query` passed through as `params` |
| Axis MTF  | `invest-preprod.axisdirect.in/sso?sso_type=MISC`             | plain `encodeURIComponent` of path; `?query` passed through as `params` |

Axis drops the input domain, percent-encodes the remaining `pathname + hash`
into `path`, and (only when the input has a `?` query) percent-encodes the whole
leftover query string into `params`. Equity and MTF differ **only** in the
`sso_type` value (`EQUITY_SMALLCASE` vs `MISC`) and the validated input domain
(`axisdirect.smallcase.com` vs `mtfbaskets.axisdirect.in`).

The HDFC IR/MTF `extra_param` JSON has this exact shape:

```json
{"path":"/smallcase/XYZ","utm_source":"","utm_medium":"","utm_campaign":"","utm_content":"","utm_term":"","add_params":true}
```

---

## 3. Code layout inside `Deeplinks.html`

The file has three parts: `<style>`, the `<body>` markup, and the `<script>`.

### `<style>`
- Starts with a **THEME TOKENS** block (CSS variables in `:root` and
  `[data-theme="dark"]`). Re-skin the whole app from here.
- The rest is plain sectioned CSS (header, tabs, card, form, utm, actions,
  output, toast, responsive). Every section has a comment header.

### `<script>` — organised into 5 numbered sections:
1. **UI HELPERS** — `toggleTheme`, `switchTab`, `showToast`, `copyToClipboard`,
   `liveValidate`. Presentation only; safe to tweak.
2. **VALIDATION GATE** — `validate()` (the strict prefix check that gates
   generation) + `base64Encode()`.
3. **GENERATORS** — `generateSBIEQ`, `generateSBIMTF`, `generateHDFCIR`,
   `generateHDFCMTF`, `generateHDFCSky`, `generateAxisEQ`, `generateAxisMTF`.
   **← business logic, do not edit output.**
4. **SAMPLE LOADERS** — `loadXXXSample()` fill demo data.
5. **KEYBOARD SHORTCUTS** — routes ⌘/Ctrl+Enter (generate), ⌘/Ctrl+Shift+C
   (copy), ⌘/Ctrl+J (theme) based on the active tab + focused card.

---

## 4. The validation model (why there are two validators)

There was a bug where red "Invalid" errors flashed while the user was still
typing. It's fixed by splitting validation in two:

- **`liveValidate()`** runs on every keystroke (`oninput`). It is *friendly*:
  shows the green **Valid** badge when the prefix matches, and otherwise stays
  **neutral**. It NEVER shows the red error while typing.
- **`validate()`** runs only when the user commits — i.e. inside each
  `generate*()` and the sample loaders. It DOES show the red invalid state,
  because at that point a bad URL is a real, reportable error.

When you add a broker, wire the input's `oninput` to `liveValidate(...)` and let
the generator call `validate(...)`. Both take the same args:
`(inputEl, domainString, badgeEl, errEl)`.

---

## 5. ID naming convention

Per generator you need a consistent set of IDs. Using **HDFC IR** as the
template (`hdfc_ir`):

| Purpose            | ID pattern              | Example (HDFC IR)      |
|--------------------|-------------------------|------------------------|
| URL input          | `<key>Input`            | `hdfc_irInput`         |
| Valid/Invalid badge| `<key>Badge` *(compact)*| `hdfcirBadge`          |
| Error text `<div>` | `<key>Err` *(compact)*  | `hdfcirErr`            |
| Output `<textarea>`| `<key>Output`           | `hdfc_irOutput`        |
| UTM inputs         | `<key>_utm_source` etc. | `hdfc_ir_utm_source`   |
| add_params checkbox| `<key>_add_params`      | `hdfc_ir_add_params`   |
| Card wrapper       | `<broker>-<prod>-card`  | `hdfc-ir-card`         |
| Tab panel          | `<tab>-content`         | `hdfc-content`         |

> ⚠️ Note the badge/err IDs are **compact** (no underscore: `hdfcirBadge`, not
> `hdfc_irBadge`) — that's a historical quirk. Match whatever you use in the
> HTML with what the generator references. Consistency within a generator is all
> that matters.

The keyboard-shortcut router and `switchTab` depend on `*-content` (tab panels)
and `*-card` (cards) IDs, so keep those.

---

## 6. ➕ Recipe: adding a new broker (e.g. Axis + Axis MTF)

Assume Axis lives in its **own new tab** (like SBI and HDFC). If instead Axis is
just another card inside an existing tab, skip the tab steps.

**Before you start:** get the real answers to these from the broker/PM —
guessing will produce broken links:
- The **web domain** each URL must start with (for the `validate` gate).
- The exact **output deep-link format** (route/`sso_key`, and how `path`/params
  are encoded — base64? plain? JSON `extra_param`?).
- Whether it supports **UTM parameters**.

### Step 1 — Add the tab button
In the `.tabs-container`:
```html
<button class="tab-button" onclick="switchTab('axis', this)">Axis</button>
```

### Step 2 — Add the tab panel + card(s)
Copy an existing `.tab-content` block and adapt IDs/labels. Use the **SBI card**
as the template if Axis has no UTMs, or the **HDFC IR card** if it does.
Minimum for one Axis product (key = `axis`):
```html
<div id="axis-content" class="tab-content">
  <div class="tab-intro">Paste an <strong>Axis</strong> Equity Portfolios and Basket Investing web URL…</div>

  <div class="card" id="axis-eq-card">
    <div class="card-head">
      <div class="card-titles">
        <span class="chip chip-eq">Equity</span>
        <h2><a href="https://SMALLCASE_WEB_DOMAIN/" target="_blank" rel="noopener">Axis · Equity Portfolios and Basket Investing</a></h2>
      </div>
    </div>
    <div class="field">
      <div class="field-label-row">
        <label for="axisInput">Equity Portfolios and Basket Investing URL</label>
        <span id="axisBadge" class="badge"></span>
      </div>
      <input id="axisInput" type="text"
             placeholder="https://SMALLCASE_WEB_DOMAIN/smallcase/AXIS_0001"
             oninput="liveValidate(this,'https://SMALLCASE_WEB_DOMAIN',axisBadge,axisErr)" />
      <p class="hint">Must start with <code>SMALLCASE_WEB_DOMAIN</code></p>
      <div id="axisErr" class="error-text">Invalid Axis Equity Portfolios and Basket Investing URL</div>
    </div>
    <div class="actions">
      <button class="btn primary" onclick="generateAxis()">Generate deep link</button>
      <button class="btn ghost" onclick="loadAxisSample()">Load sample</button>
    </div>
    <div class="output">
      <div class="output-head">
        <span class="output-title">Generated deep link</span>
        <button class="btn copy" onclick="copyToClipboard('axisOutput')">Copy</button>
      </div>
      <textarea id="axisOutput" readonly placeholder="Your deep link will appear here after you click Generate."></textarea>
    </div>
  </div>
  <!-- Add an axis-mtf-card here the same way for Axis MTF -->
</div>
```
For **Axis MTF**, duplicate the card with key `axis_mtf`, id `axis-mtf-card`,
and (if it has UTMs) copy the `.utm` block from HDFC, renaming every
`hdfc_mtf_*` id to `axis_mtf_*`.

### Step 3 — Add the generator(s) in `<script>` §3
Model it on the closest existing broker. Example skeleton (adjust the output to
the **real** Axis format):
```js
function generateAxis() {
  const i = axisInput, o = axisOutput;
  if (!validate(i, "https://SMALLCASE_WEB_DOMAIN", axisBadge, axisErr)) {
    showToast("Invalid Axis URL");
    return;
  }
  try {
    const [b, p] = i.value.split("?");
    const u = new URL(b);
    const path = u.pathname + u.hash;

    o.value = /* <-- REAL Axis deep-link format goes here */ ;

    showToast("Axis deep link generated");
  } catch {
    o.value = "⚠️ Error generating link";
    showToast("Error generating link");
  }
}
```
If Axis MTF uses the HDFC-style JSON `extra_param`, copy `generateHDFCMTF`
verbatim and change only the `sso_key` and the UTM element IDs.

### Step 4 — Add sample loader(s) in §4
```js
function loadAxisSample() {
  document.getElementById('axisInput').value = 'https://SMALLCASE_WEB_DOMAIN/smallcase/AXIS_0001';
  validate(document.getElementById('axisInput'), 'https://SMALLCASE_WEB_DOMAIN', axisBadge, axisErr);
}
```
(If it has UTMs, also seed the `axis_*_utm_*` fields like `loadHDFCIRSample`.)

### Step 5 — Wire keyboard shortcuts in §5
Add an `else if` branch for the new tab in **both** the Generate and Copy
routers:
```js
} else if (active.id === 'axis-content') {
  if (document.activeElement.closest("#axis-mtf-card")) generateAxisMTF();
  else generateAxis();
}
```
…and the mirror for copy with `copyToClipboard('axisOutput' / 'axis_mtfOutput')`.

### Step 6 — Test (see §8) and sync files (§7).

---

## 7. Build / sync / run

There is **no build step** — it's static HTML.

**Sync the two copies after every edit** (edit `Deeplinks.html`, then):
```bash
cp Deeplinks.html index.html
```
> Tip: if you'd rather have a single source of truth, replace `index.html` with
> a redirect or a Vercel rewrite to `Deeplinks.html`. Until then, keep them in
> sync manually.

**Run locally:**
```bash
python3 -m http.server 3000
# then open http://localhost:3000/  (index.html) or /Deeplinks.html
```

---

## 8. Testing checklist (do this before deploying)

For each generator:
- [ ] **Load sample → Generate** produces the expected deep link.
- [ ] Output string matches the agreed format **exactly** (encoding, order,
      `sso_key`). Diff against a known-good link.
- [ ] Typing a **partial** URL shows **no** red error (phantom-error regression).
- [ ] A wrong-domain URL + **Generate** shows the red error + toast.
- [ ] **Copy** button copies and toasts; on empty output it says "nothing to copy".
- [ ] Keyboard shortcuts work while focused in that card.
- [ ] Looks right in **light + dark** and on **mobile** width.
- [ ] `Deeplinks.html` and `index.html` are **identical** (`diff` them).

Quick way to verify outputs from the browser console:
```js
loadHDFCIRSample(); generateHDFCIR(); hdfc_irOutput.value
```

---

## 9. Deployment (GitHub + Vercel)

The repo is already connected to both. Deploys are done **via CLI** (the Vercel
project is not auto-building from GitHub pushes unless configured in the Vercel
dashboard → Settings → Git).

```bash
# 1. Commit + push to GitHub
git add .
git commit -m "your message"
git push

# 2. Deploy to Vercel production
vercel deploy --prod --yes
```
- **GitHub:** https://github.com/kartikeya1/deeplinks-generator
- **Live site:** https://deeplinks-generator.vercel.app

---

## 10. File structure

```
Deeplinks/
├── index.html            # Served at root by Vercel (DUPLICATE of Deeplinks.html)
├── Deeplinks.html        # Canonical working copy — edit here, then copy to index.html
├── README.md             # This file
├── package.json          # Metadata + local `dev` server script
├── vercel.json           # Vercel config (cleanUrls)
├── hdfc_utm_link_builder.html   # Original reference for the HDFC extra_param JSON logic
├── SBI Deeplinks.html           # Legacy standalone (pre-merge) — kept for history
└── Deeplinks for HDFC IR, IRMTF, Sky.html  # Legacy standalone (pre-merge)
```
The three legacy/reference HTMLs are **not** part of the app; they document how
the logic was originally derived. Safe to ignore when editing the live tool.
