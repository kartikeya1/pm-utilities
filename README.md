# 🧮 Product Management — Utilities

A portfolio of internal **Product Management** tools and utilities, served as a single Vercel site.
The home page is a directory of tools; each card opens a self-contained, zero-build web app at its
own route.

<br>

## Projects

| Route | Tool | What it is |
|-------|------|------------|
| [`/sbi-recon-evolution`](sbi-recon-evolution/) | **SBI Reconciliation Tool — Evolution** | CSV combining + reconciliation in the browser via Pyodide (pandas), shown in two design iterations. |
| [`/deeplinks-generator`](deeplinks-generator/) | **Equity Portfolios and Basket Investing Deep Links Generator** | Converts a broker's Equity Portfolios and Basket Investing web URL into a ready-to-use in-app deep link (SBI, HDFC, Axis). |

<br>

## SBI Reconciliation Tool — Evolution

A **single-file web application** demonstrating an approach to building internal tools: **utility
first, then polish with thoughtful UX/UI**. It showcases two versions of the same tool in one
interactive experience.

- **Version 1 — Utility First 🔧** — the bare-bones original: core business logic (CSV combining,
  reconciliation), functional file handling with Pyodide (Python in the browser), direct
  problem-solving. Goal: *"Does this solve the problem?"*
- **Version 2 — UX Polish ✨** — same powerful logic, designed for real users: file metadata
  (size, count), validation hints and error messages, a professional design system, animated
  status/loading states, structured colored logging, accessible responsive layout.
  Goal: *"How do I make this trustworthy and delightful?"*

### Features

**CSV Combining** — upload multiple CSV files, merge them into a single output, instant download.

**Reconciliation** — upload two fixed-format CSV files (Combined CS + Athena File); automatic
reconciliation with pandas; generates **6 output reports** (Matching Unique Keys Summary, Missing in
Equity Portfolios and Basket Investing, Missing in SSL, Date Mismatches, Quantity Mismatches, Turnover Mismatches); download all
results as a ZIP.

### Architecture & design system

The HTML contains both implementations side by side in tabs. V1 uses minimal CSS + semantic markup;
V2 layers a design system with CSS variables and grid layouts. Switching versions reuses the same
Pyodide runtime and business logic — only the UI layer changes.

```css
--brand: #1d4ed8    /* Primary actions */
--success: #059669  /* Matching records */
--warning: #d97706  /* Mismatches */
--error: #dc2626    /* Failures */
--bg: #f5f7fb       /* Page background */
```
Responsive breakpoint at 900px for mobile.

### Portfolio value

Demonstrates problem-first thinking (a real bottleneck — manual reconciliation took hours),
backend chops (Python logic: unique-key construction, mismatch detection, ZIP generation),
frontend judgment (two versions show that **utility ≠ UX**), technical breadth (Pyodide, pandas,
CSV/ZIP handling, browser APIs), accessibility (ARIA labels, focus management, keyboard support,
contrast), and polish (feedback loops, error handling, logging).

Originally built for internal use at Equity Portfolios and Basket Investing; the evolution story is intentionally preserved.

### Future enhancements

- [ ] Excel (.xlsx) output instead of ZIP
- [ ] Drag-and-drop file upload
- [ ] Data preview before processing
- [ ] Configurable key columns
- [ ] Export reconciliation rules as JSON
- [ ] Dark mode toggle

<br>

## Equity Portfolios and Basket Investing Deep Links Generator

A single-file web tool that converts a broker's **Equity Portfolios and Basket Investing web URL** into a **ready-to-use in-app
deep link**. It supports **SBI Securities** (Equity, MTF), **HDFC** (IR, MTF, HDFC Sky) and
**Axis** (Equity, MTF).

Every broker follows the same 3-step shape: **validate** the pasted URL starts with the expected
domain → **split** the URL into base + query and derive the path → **assemble** the broker-specific
deep-link string (for HDFC IR/MTF, embedding UTM fields into a JSON `extra_param`).

### Supported output formats

| Product   | `sso_key` / route                    | Encoding of path/params |
|-----------|--------------------------------------|-------------------------|
| SBI EQ    | `mobile.sbisecurities.in/invest`     | **base64** of `encodeURIComponent` |
| SBI MTF   | `mobile.sbisecurities.in/dashboard`  | **base64** of `encodeURIComponent` |
| HDFC IR   | `sso_key=IR_SMALLCASE`               | **JSON → `encodeURIComponent`** into `extra_param` |
| HDFC MTF  | `sso_key=IR_MTF_BASKET_SMALLCASE`    | **JSON → `encodeURIComponent`** into `extra_param` |
| HDFC Sky  | `hdfcsky.com/sky/hdfc-small-case`    | plain `encodeURIComponent` |
| Axis EQ   | `sso_type=EQUITY_SMALLCASE`          | plain `encodeURIComponent` of path/params |
| Axis MTF  | `sso_type=MISC`                      | plain `encodeURIComponent` of path/params |

> ⚠️ **The link-generation business logic is verified correct in production — do not change what
> any `generate*()` function outputs.** Restyle freely; never touch the output format. The full
> engineering guide, ID naming convention, and a step-by-step **recipe for adding a new broker**
> live in [`deeplinks-generator/ENGINEERING.md`](deeplinks-generator/ENGINEERING.md). Read its
> "Golden rules" before editing. Reference/legacy HTMLs are preserved under
> [`deeplinks-generator/reference/`](deeplinks-generator/reference/).

<br>

## Architecture

```
pm-utilities/
├── index.html                          # Generic home shell (loads config + renderer)
├── config/
│   ├── site.js                         # window.SITE — page title, tagline, emoji, accent
│   └── projects.js                     # window.PROJECTS — THE registry (single source of truth)
├── assets/
│   ├── home.css                        # Shared card-grid styling (dark, responsive)
│   └── home.js                         # Renders cards from window.PROJECTS
├── sbi-recon-evolution/index.html      # Route: /sbi-recon-evolution  (Pyodide via CDN)
├── deeplinks-generator/
│   ├── index.html                      # Route: /deeplinks-generator  (the live app)
│   ├── ENGINEERING.md                  # Full engineering guide + add-a-broker recipe
│   └── reference/                      # Legacy/reference HTMLs (not routed, not deployed)
├── vercel.json
└── README.md
```

**How routing works.** Each tool is a top-level folder served natively by Vercel at `/<folder>` —
clean routes, deep links, and refresh with **no rewrite rules**. All asset paths are relative, so
nesting under a route works unchanged. The home page renders from `config/projects.js`.

<br>

## Development

No build step. Serve the folder with any static server:

```bash
python3 -m http.server 8000
# home:           http://localhost:8000/
# reconciliation: http://localhost:8000/sbi-recon-evolution/
# deep links:     http://localhost:8000/deeplinks-generator/
```

The SBI tool loads Pyodide (pandas) from a CDN on first use — allow a few seconds and keep the tab
online for that initial load.

<br>

## Adding a future utility

Two steps, one config edit:

1. **Drop the folder** at the repo root, e.g. `my-tool/index.html` (relative asset paths).
2. **Add one entry** to `config/projects.js`:

   ```js
   { slug: "my-tool", title: "My Tool", tagline: "One-line description.", tags: ["Tag"] }
   ```

`slug` must equal the folder name (it becomes the route). The home page updates automatically — no
changes to `index.html`, `home.js`, or `vercel.json`.

<br>

## Deployment (Vercel)

Zero-config static site: push to GitHub, import in Vercel (preset **Other**, no build, output =
root), deploy. `vercel.json` keeps native filesystem routing and preserves the SBI tool's
`Cache-Control: public, max-age=3600` header (scoped to `/sbi-recon-evolution/`).

<br>

## Tech

Vanilla HTML / CSS / JavaScript; **Pyodide** (pandas in the browser) for the SBI tool. No build, no
framework. See [`MIGRATION.md`](MIGRATION.md) for how this repo was consolidated and validated.
