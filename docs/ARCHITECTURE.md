# Architecture

ReqForge is a single-file static web application. The entire pipeline lives in `index.html`. This document describes the internal data flow.

## Pipeline overview

```
┌─────────────┐    ┌──────────┐    ┌───────────┐    ┌──────────┐
│ Raw source  │ →  │ parse    │ →  │ extract   │ →  │ normalize│
│ text / docs │    │ Document │    │ Candidates│    │          │
└─────────────┘    └──────────┘    └───────────┘    └────┬─────┘
                                                          ↓
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────────┐
│ ReqIF    │ ←  │ trace    │ ←  │ validate │ ←  │ classify +   │
│ + checks │    │ ability  │    │ quality  │    │ build        │
│          │    │          │    │          │    │ hierarchy    │
└──────────┘    └──────────┘    └──────────┘    └──────────────┘
```

## Stages

### 1. `parseDocument(text, docName)`
Splits raw text into a sequence of structured nodes: `{kind:'heading'|'body', ...}`. Detects:
- Markdown headings (`# … ######`)
- Numbered headings (`1.2.3 Title`)
- ALL-CAPS short headings
- Form-feed (`\f`) and "Page N" markers for page tracking
- TOC entries (dotted leaders) and discards them
- Maintains a `path` of ancestor sections on every body line

### 2. `extractCandidates(struct)`
For each body line:
- Skip if it sits under an ignored section (TOC, revision history, legal, marketing)
- Skip if it contains marketing keywords without a modal verb
- Sentence-split and emit any sentence containing a modal verb (`shall / must / will / should / is required to / needs to / has to`)

### 3. `normalize(cands)`
For each candidate sentence:
- `splitCompound` separates `"X and shall Y"` constructs into atomic statements; subject is captured up to (but not including) the first modal verb
- `toDngText` rewrites all modals to `shall`, prepends `"The system"` if no actor is present, capitalizes, terminates with a period
- `makeTitle` derives a short title from the first content words after `"The X shall"`
- Stores `original` and `text` side-by-side; `compound:true` if it came from a split

### 4. `classify(req)`
Pattern-based 12-type classification with weighted keyword matches. Each type has a regex and a weight; the highest-scoring type wins. Confidence is a function of pattern strength. Priority is derived from safety/security/critical keywords.

### 5. `buildHierarchy(reqs)`
Walks the ancestor `path` of each requirement and assembles a nested tree of sections, each containing its child sections and its requirements. Requirements with no section become orphans (currently never occurs with the heading detector).

### 6. `validate(reqs)`
Per-requirement intrinsic checks:
- Ambiguous-word scan against a 20+ term blocklist
- Non-testable detection (quality claim + no measurable criterion)
- Missing actor / condition / acceptance criteria

Cross-requirement checks:
- `detectDuplicates`: token-set Jaccard ≥ 0.6 (semantic), ≥ 0.82 (near), exact normalized string match (exact)
- `detectConflicts`: shall vs shall-not contradiction with topic overlap; same-unit numeric limits that disagree

### 7. `buildTraceability(reqs, baseline)`
For each requirement, finds its best Jaccard match in the baseline and assigns a typed link based on similarity bands and type match:
- ≥ 0.80 → `Duplicate Of`
- ≥ 0.55 → `Refines`
- ≥ 0.35 with matching type → `Satisfies`
- ≥ 0.30 → `Derives From`
- ≥ 0.18 → `Related To`
- shall-not mismatch with high overlap → `Conflicts With`

Links with confidence < 0.6 are flagged for manual review.

### 8. `computeReadiness(reqs)` + `generateReqIF(reqs, cfg)` + `validateReqIF(xml)`
Each requirement gets a 10-point checklist; `ready` is true when all 10 pass. ReqIF emission produces the complete OMG 1.0 schema:

```
REQ-IF
├── THE-HEADER
│   └── REQ-IF-HEADER (creation time, repo id, tool id, version)
└── CORE-CONTENT
    └── REQ-IF-CONTENT
        ├── DATATYPES
        │   ├── DATATYPE-DEFINITION-STRING (DT-STRING)
        │   ├── DATATYPE-DEFINITION-XHTML  (DT-XHTML)
        │   ├── DATATYPE-DEFINITION-ENUMERATION (DT-TYPE, 12 values)
        │   └── DATATYPE-DEFINITION-ENUMERATION (DT-PRIO, 3 values)
        ├── SPEC-TYPES
        │   ├── SPEC-OBJECT-TYPE (OT-REQ + 5 attribute definitions)
        │   ├── SPECIFICATION-TYPE (ST-MODULE)
        │   └── SPEC-RELATION-TYPE (RT-LINK)
        ├── SPEC-OBJECTS    (one per requirement, all 5 attrs populated)
        ├── SPEC-RELATIONS  (one per approved traceability link)
        └── SPECIFICATIONS
            └── SPECIFICATION (SPEC-MODULE)
                └── CHILDREN
                    └── SPEC-HIERARCHY[] (one per requirement)
```

Validation parses the emitted XML via `DOMParser` and confirms:
- `parsererror` is absent
- `REQ-IF-HEADER` and `SPEC-OBJECTS` elements exist
- Every `SPEC-OBJECT-REF` in the hierarchy resolves to a defined spec-object
- Every `ENUM-VALUE-REF` resolves to a defined enum value

## Data model — Requirement

```js
{
  id: 'REQ-0001',
  title: 'Deliver medication at a programmed rate',
  text:  'The system shall deliver medication at a programmed rate ...',  // DNG-ready
  original: 'The system shall deliver medication at a ...',               // verbatim
  rewritten: false,                                                       // was modal rewritten?
  type: 'Functional',
  typeConf: 0.84,
  priority: 'Medium',                  // High / Medium / Low
  doc: 'Pasted specification',
  section: 'Dose Delivery',
  sectionPath: 'Doc › 4 Functional › 4.1 Dose Delivery',
  page: 1,
  confidence: 0.90,
  status: 'review',                    // review / approved / rejected
  flags: {
    ambiguous: ['fast', 'user-friendly'],
    nonTestable: false,
    compound: true,
    missing: ['acceptance criteria'],
    duplicateOf: [{id:'REQ-0009', kind:'near', sim:0.86}],
    conflictsWith: [{id:'REQ-0011', why:'numeric limit clash'}],
    orphan: false,
  },
  links: [/* traceability links */],
  ready: true,
  readyChecklist: { statement, title, validType, mandatoryAttrs,
                    sourceTrace, validHierarchy, noConflicts,
                    noDuplicates, schemaValid, reqifValid }
}
```

## Why a single file

Zero build complexity means no toolchain risk for downstream users. The entire pipeline ships as one HTML file that runs offline. Production deployments would split this into modules, add server-side document parsing (pdf.js / mammoth.js / Apache Tika), and route classification through an LLM for semantic accuracy.
