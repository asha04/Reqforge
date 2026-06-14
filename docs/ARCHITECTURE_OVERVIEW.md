# ReqForge Architecture & Tech Stack

## High-Level Design

```
┌────────────────────────────────────────────────────────────────┐
│                      ReqForge Browser UI                        │
│  (Single-file HTML + CSS + JavaScript, no build system)         │
└────────────────────────────────────────────────────────────────┘
                             │
                             ↓
         ┌───────────────────────────────────────┐
         │   Eight-Stage Requirements Pipeline   │
         ├───────────────────────────────────────┤
         │ 1. Parse Document                     │
         │ 2. Extract Candidates                 │
         │ 3. Normalize to DNG                   │
         │ 4. Classify (12 types)                │
         │ 5. Build Hierarchy                    │
         │ 6. Validate Quality                   │
         │ 7. Build Traceability                 │
         │ 8. Generate ReqIF XML                 │
         └───────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ↓                    ↓                    ↓
   ┌─────────────┐   ┌────────────────┐   ┌──────────────┐
   │  ReqIF 1.0  │   │  Review CSV    │   │ Struct. JSON │
   │  XML Export │   │  for Import    │   │ Representation
   └─────────────┘   └────────────────┘   └──────────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             ↓
                   ┌──────────────────────┐
                   │ DNG/DOORS Integration│
                   │ (Manual Upload)      │
                   └──────────────────────┘
```

## Architecture Layers

### 1. **Presentation Layer** (HTML/CSS/JavaScript)
- Single-file application (`index.html`)
- Interactive review workspace
- Real-time readiness score updates
- Human-in-the-loop approval workflows

### 2. **Pipeline Logic Layer** (Pure JavaScript)
- Document parsing and heading detection
- Requirement extraction using modal verb patterns
- Normalization to shall-form DNG statements
- Multi-type classification with confidence scoring
- Hierarchy reconstruction from document structure
- Quality validation (ambiguity, duplicates, conflicts)
- Traceability link generation with 8 link types
- ReqIF 1.0 XML generation and self-validation

### 3. **Data Model Layer**
- Requirement objects with 15+ metadata fields
- Hierarchy tree structure (sections → requirements)
- Traceability link objects with confidence scores
- Validation flags and readiness checklists

### 4. **Output Layer**
- ReqIF 1.0 XML conforming to OMG schema
- Native browser DOMParser validation
- CSV export for manual DNG import
- JSON structured representation
- Executive summary reports

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (ES6+) | User interface, zero-dependency |
| **Parser** | Native browser APIs (TextDecoder, DOMParser) | Document parsing, XML validation |
| **Data Processing** | JavaScript Set/Map/Array operations | Requirement extraction, deduplication |
| **Pattern Matching** | Regular expressions | Modal verb detection, heading detection, ambiguity scanning |
| **Similarity Matching** | Jaccard token-set comparison | Duplicate detection, traceability scoring |
| **ReqIF Generation** | Template-based XML string building | OMG ReqIF 1.0 schema compliance |
| **Build System** | None — zero-config | Shipped as single HTML file |
| **Testing** | Node.js headless harness (`validate.mjs`) | 50-check validation suite |
| **Validation** | Python ElementTree (optional CI) | Independent ReqIF schema verification |
| **Version Control** | Git, GitHub | Repository and PR workflows |

### Deployment Model

**Current (Prototype):**
- Single HTML file served statically
- Runs entirely client-side, offline-capable
- No backend server required
- No build or dependency installation needed

**Future (Production):**
- Server-side document parsing (PDF via `pdf.js`, DOCX via `mammoth.js`, binary via Apache Tika)
- LLM-powered classification (Anthropic API integration)
- Direct OSLC connector for DNG/DOORS staged uploads
- ReqIF round-trip import
- Multi-user review workflow with audit trail
- Database for requirement versioning and audit

---

## Key Design Patterns

### 1. **Pipeline Architecture**
Each stage (parse → extract → normalize → classify → etc.) is independent and composable. Stages communicate via well-defined data structures (Requirement objects, hierarchy trees). This makes the pipeline testable, debuggable, and extensible.

### 2. **Human-in-the-Loop**
No requirement is ever auto-imported into DNG. Every stage that affects DNG readiness (approval, traceability, classification override) requires explicit human consent. Status is tracked: `review → approved → ready-for-upload`.

### 3. **Confidence Scoring**
All outputs (classification, traceability, readiness) include confidence scores and explanation metadata. Low-confidence results are flagged for manual review rather than silently accepted.

### 4. **Quality as Data**
Validation results are not binary pass/fail but structured metadata (flags array, checklist object). Users see exactly which criteria are satisfied and which need attention.

### 5. **Automotive Safety Focus**
The classification taxonomy and validation rules are designed to catch safety-critical issues early: missing acceptance criteria, ambiguous language, conflicting limits, non-testable claims. Traceability supports safety-chain decomposition (system → subsystem → component → safety constraint).

---

## Data Flow Example: A Single Requirement

### Input
```
Raw text: "The system must deliver medication at a programmed rate, and log every bolus event."
```

### Pipeline Stages

1. **Parse**: Assign to section "Dose Delivery", page 1, source doc "Spec v2"
2. **Extract**: Detect modal verb `must`, emit as candidate
3. **Normalize**: 
   - Split compound: produces two requirements
   - Rewrite to shall: `"The system shall deliver medication at a programmed rate."`
   - Generate title: "Deliver medication at programmed rate"
4. **Classify**: 
   - Match keywords → `Functional` type, confidence 0.92
   - Assign priority → Medium
5. **Hierarchy**: Place under `Dose Delivery` section
6. **Validate**: 
   - Check: "programmed rate" is measurable → non-testable: false
   - Check: no ambiguous terms found
   - Flag: compound split applied
7. **Traceability**: 
   - Compare against baseline requirements
   - Find near-match REQ-0042 (Jaccard 0.71) → `Refines` link, confidence 0.71
8. **ReqIF**: 
   - Emit as `SPEC-OBJECT` with all 5 attributes
   - Create `SPEC-RELATION` to REQ-0042
   - Validate schema

### Output
```json
{
  "id": "REQ-0001",
  "title": "Deliver medication at programmed rate",
  "text": "The system shall deliver medication at a programmed rate.",
  "original": "The system must deliver medication at a programmed rate...",
  "type": "Functional",
  "typeConf": 0.92,
  "priority": "Medium",
  "section": "Dose Delivery",
  "sectionPath": "Spec v2 › 4 Functional › 4.1 Dose Delivery",
  "page": 1,
  "status": "review",
  "flags": { "compound": true, "ambiguous": [], "nonTestable": false },
  "links": [{ "type": "Refines", "target": "REQ-0042", "confidence": 0.71 }],
  "ready": true,
  "readyChecklist": {
    "statement": true, "title": true, "validType": true,
    "mandatoryAttrs": true, "sourceTrace": true, "validHierarchy": true,
    "noConflicts": true, "noDuplicates": true,
    "schemaValid": true, "reqifValid": true
  }
}
```

---

## Automotive Industry Alignment

**ISO 26262 Functional Safety:**
- Requirement atomicity enforces ASIL decomposition
- Traceability links support safety-chain evidence
- Conflict detection catches contradictory safety constraints
- Readiness scoring ensures completeness before DNG upload

**AUTOSAR/Architecture Frameworks:**
- Hierarchy reconstruction aligns with AUTOSAR layer mapping
- Classification supports both functional and non-functional system properties
- Metadata preservation enables architecture-level traceability

**DNG/DOORS Integration:**
- ReqIF 1.0 schema compliance ensures direct import without transformation
- Confidence scoring and manual review gates prevent defective mass imports
- Hierarchical spec-hierarchy maps directly to DOORS module structure

---

## Validation & Testing

The 50-check validation harness (`scripts/validate.mjs`) runs the entire pipeline headlessly:

- **Extraction**: ≥12 requirements, TOC/boilerplate filtered
- **Conversion**: Shall-form, no modal artifacts, titles, periods
- **Classification**: 12-type taxonomy, [0,1] confidence
- **Hierarchy**: ≥4 sections, no orphans, correct nesting
- **Validation**: Ambiguity, duplicates, conflicts, non-testable detected
- **Traceability**: 8 link types, confidence scores, explanations
- **ReqIF**: Schema valid, all enums resolve, all refs resolve
- **Readiness**: 10-point checklist, percentage [0,100]

All 50 checks pass on the sample medical-device specification; results are reproducible via `node scripts/validate.mjs`.

---

## Security & Privacy

- **Client-side only**: No document content transmitted to external servers
- **Offline capable**: Works without internet connection once HTML is loaded
- **Open source**: MIT license, full source transparency
- **No tracking**: No analytics or telemetry
- **User control**: Human review gates prevent automated uploads

---

## Future Extensions

| Feature | Impact | Effort |
|---------|--------|--------|
| Browser PDF parsing (`pdf.js`) | Support native PDF upload | Medium |
| Browser DOCX parsing (`mammoth.js`) | Support native DOCX upload | Medium |
| LLM classification (Anthropic) | Improve accuracy & confidence | Medium |
| Direct DNG connector (OSLC) | One-click upload to DOORS | High |
| ReqIF round-trip | Import baseline, export delta | Medium |
| Custom attribute editor | Support non-standard schemas | Medium |
| Multi-user workflow | Assign review tasks, audit trail | High |
| Versioning & audit | Track requirement lineage | High |

