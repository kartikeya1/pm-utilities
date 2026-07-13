// ============================================================
//  PROJECT REGISTRY  —  the single source of truth.
//
//  To add a new utility:
//    1. Drop its folder at the repo root (e.g.  my-tool/index.html).
//    2. Add one entry below. `slug` MUST match the folder name.
//  Nothing else changes — the home page renders automatically.
// ============================================================
window.PROJECTS = [
  {
    slug: "sbi-recon-evolution",
    title: "SBI Reconciliation Tool — Evolution",
    tagline: "CSV combining and reconciliation running entirely in the browser via Pyodide (pandas). Shows the tool in two versions: utility-first, then UX-polished.",
    tags: ["Pyodide", "Reconciliation", "CSV"]
  },
  {
    slug: "deeplinks-generator",
    title: "smallcase Deep Links Generator",
    tagline: "Converts a broker's smallcase web URL into a ready-to-use in-app deep link. Supports SBI Securities (Equity, MTF), HDFC (IR, MTF, HDFC Sky) and Axis (Equity, MTF).",
    tags: ["Deep Links", "SBI", "HDFC", "Axis"]
  }
];
