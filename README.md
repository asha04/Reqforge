# ReqForge

**DNG Requirements Conversion & ReqIF Generation Platform**

ReqForge converts unstructured Word/PDF/text specifications into DOORS Next Generation (DNG)-ready requirements with traceability, hierarchy reconstruction, quality validation, and standards-compliant ReqIF 1.0 export — entirely in your browser.

![Status](https://img.shields.io/badge/status-prototype-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![ReqIF](https://img.shields.io/badge/ReqIF-1.0-orange) ![No build](https://img.shields.io/badge/build-zero%20config-success)

---

## What it does

Upload or paste a specification document. ReqForge runs an eight-stage pipeline:

1. **Read** documents and map page numbers
2. **Extract** requirement candidates (modal verbs: shall / must / will / should)
3. **Normalize** to atomic, shall-form DNG-ready statements
4. **Classify** into 12 requirement types with confidence scoring
5. **Reconstruct** the section hierarchy and parent-child relationships
6. **Validate** quality — ambiguity, duplicates, conflicts, non-testable, missing info
7. **Trace** against an existing DNG baseline (optional) — 8 typed link suggestions
8. **Emit and self-validate** a ReqIF 1.0 XML file with datatypes, enumerations, spec-objects, spec-relations, and a nested spec-hierarchy

The interactive review workspace lets you approve, reject, edit, merge duplicates, resolve conflicts, and approve traceability links before export. The **DNG Upload Readiness Score** updates live as you work.

---

## Quick start

No build step, no dependencies, no server needed.

```bash
# 1. Clone
git clone https://github.com/<your-username>/reqforge.git
cd reqforge

# 2. Open in a browser
open index.html          # macOS
xdg-open index.html      # Linux
start index.html         # Windows

# Or serve over HTTP (any static server works)
python3 -m http.server 8000
# → http://localhost:8000
```

Then click **"Load sample specification"** → **"Analyze & convert"** to see the full pipeline run on a built-in medical-device specification (16 requirements extracted, 9 traceability links suggested, ReqIF validated).

---

## Project structure

```
reqforge/
├── index.html              # The entire application — open this
├── README.md               # You are here
├── LICENSE                 # MIT
├── .gitignore
├── docs/
│   ├── ARCHITECTURE.md     # Pipeline internals, data model, ReqIF mapping
│   ├── REQUIREMENTS.md     # Original product specification
│   └── VALIDATION.md       # 50/50 validation test results
├── samples/
│   ├── sample-output.reqif # Generated ReqIF from the built-in sample spec
│   └── sample-output.json  # Structured JSON of all extracted requirements
└── scripts/
    ├── push-to-github.sh   # One-command repo push helper
    └── validate.mjs        # Headless Node validation harness
```

---

## Features

### Document processing
- Pasted text, `.txt`, `.md` parsed directly in the browser
- Heading detection (Markdown `#`, numbered `1.2.3`, ALL-CAPS)
- Page-number tracking from form-feed and "Page N" markers
- Auto-skip of TOC, revision history, marketing boilerplate, copyright/legal sections
- PDF / DOCX binary parsing is server-side in a production deployment; this prototype accepts pasted text

### Requirement conversion
Every requirement is rewritten to be:
- **Atomic** — compound `"X and shall Y"` statements are split
- **Shall-form** — `must / will / should / is required to / needs to / has to` rewritten to `shall`
- **Subject-anchored** — adds `"The system"` if a sentence lacks a clear actor
- **Properly terminated** — every statement ends with a period
- **Faithful** — original source text is always preserved alongside the rewrite; nothing is invented

### Classification (12 types)
Functional · Non-Functional · Performance · Interface · Security · Safety · Compliance · Data · Operational · Constraint · Assumption · Open Question

Confidence scores are derived from keyword pattern matches with type-weighted scoring.

### Quality validation
- **Ambiguous terms**: fast, user-friendly, efficient, robust, appropriate, easy, intuitive, seamless, optimal, etc.
- **Duplicate detection**: exact, near (Jaccard ≥ 0.82), and semantic (≥ 0.6) on token sets
- **Conflict detection**: shall vs shall-not contradictions, numeric-limit clashes on the same unit
- **Non-testable**: quality/performance claims with no measurable acceptance criteria
- **Compound**: multi-requirement statements that were split during normalization
- **Missing**: actor, condition, or acceptance criteria

### Traceability (8 link types)
When a baseline is provided: Derives From · Refines · Satisfies · Traces To · Depends On · Conflicts With · Duplicate Of · Related To. Each link carries a confidence score, an explanation, and a flag for manual review when confidence is low.

### DNG Upload Readiness Score
```
Readiness % = (Upload-Ready Requirements ÷ Total Extracted) × 100
```
A requirement is upload-ready only when all 10 criteria are satisfied: statement, title, valid type, mandatory attributes, source traceability, valid hierarchy, no unresolved conflicts, no unresolved duplicates, schema validation, and ReqIF validation. Updates live as you approve and edit.

### Outputs
- **ReqIF 1.0** XML, self-validated for well-formedness, attribute-reference resolution, and schema mapping
- **Review CSV** — all metadata, validation flags, confidence scores, traceability suggestions
- **Structured JSON** — full machine-readable representation
- **Executive summary** report — totals, readiness score, ReqIF validation status

### Human-in-the-loop
No requirement is ever auto-imported into DNG. Human approval is required for requirement creation, modification, traceability link creation, and ReqIF export.

---

## Validation

The pipeline is verified against the product specification with a **50-check headless test harness** that runs the actual application JavaScript under Node.js. All 50 checks pass — see [docs/VALIDATION.md](docs/VALIDATION.md) for the full list.

```bash
node scripts/validate.mjs
```

The harness exercises extraction, conversion, compound splitting, classification, hierarchy reconstruction, validation flags, traceability links, readiness scoring, and ReqIF schema integrity (parsed independently with Python's ElementTree).

---

## Roadmap

- [ ] Browser-side PDF parsing via `pdf.js`
- [ ] Browser-side DOCX parsing via `mammoth.js`
- [ ] LLM-powered classification and semantic duplicate detection (Anthropic API)
- [ ] Direct DNG/OSLC connector for staged uploads
- [ ] ReqIF round-trip: import an existing ReqIF file as the baseline
- [ ] Custom attribute-schema editor for non-standard DNG profiles
- [ ] Multi-user review workflow with assignment and audit trail

---

## Tech notes

- Pure client-side, single-file HTML — no build, no bundler, no dependencies
- Pipeline runs entirely in `<script>` against pasted text or `.txt`/`.md` uploads
- ReqIF emission uses the OMG ReqIF 1.0 namespace (`http://www.omg.org/spec/ReqIF/20110401/reqif.xsd`)
- Self-validation uses the browser's native `DOMParser` for well-formedness plus structural reference resolution

---

## License

MIT — see [LICENSE](LICENSE).

## Contributing

Contributions welcome. Open an issue describing the change, fork, branch, PR. Please run `node scripts/validate.mjs` and confirm all 50 checks still pass before submitting.
