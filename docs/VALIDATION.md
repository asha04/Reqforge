# Validation Results

The application's pipeline was validated by running its actual JavaScript headlessly under Node.js against the built-in sample medical-device specification, then asserting outcomes with both JavaScript and an independent Python XML parser.

**Result: 50 of 50 checks pass.**

To reproduce:

```bash
node scripts/validate.mjs
```

## Test categories

### Extraction & filtering (5/5)
- ✅ ≥ 12 requirements extracted from the 22-line sample spec
- ✅ Table of Contents lines ignored
- ✅ Revision history ignored
- ✅ Marketing boilerplate (`market-leading`, `best-in-class`) ignored
- ✅ Every extracted item contains a modal verb

### Conversion to DNG-ready form (6/6)
- ✅ Every requirement uses `shall`
- ✅ No `must / will / should` leaked into DNG text
- ✅ No double-modal artifacts (`shall shall`, `must shall`)
- ✅ Both original and rewritten text preserved
- ✅ Title generated for every requirement
- ✅ Every statement ends with a period

### Compound splitting (2/2)
- ✅ Compound splits applied where present
- ✅ `"X and shall Y"` correctly atomized into two requirements with proper subject restoration

### Metadata (1/1)
- ✅ All 11 mandatory fields present on every requirement (id, title, text, original, type, priority, doc, sectionPath, page, confidence, status)

### Classification (6/6)
- ✅ Every type is in the 12-type taxonomy
- ✅ Classification confidence is in [0, 1]
- ✅ Authentication requirements typed as Security
- ✅ Alarm / occlusion requirements typed as Safety
- ✅ HL7 / USB requirements typed as Interface
- ✅ Self-test / accuracy requirements typed as Performance

### Quality validation (5/5)
- ✅ ≥ 2 ambiguous requirements detected
- ✅ `fast` / `user-friendly` flagged
- ✅ `robust` flagged
- ✅ ≥ 2 duplicate candidates detected (semantic Jaccard pairing)
- ✅ ≥ 1 non-testable requirement detected

### Hierarchy (5/5)
- ✅ ≥ 4 distinct sections reconstructed
- ✅ No TOC dotted-leader artifacts in section paths
- ✅ Dose Delivery section present
- ✅ Alarms section present
- ✅ No orphans

### Traceability (5/5)
- ✅ ≥ 4 links generated against the baseline
- ✅ All link types are from the 8-type spec set
- ✅ All links carry a confidence score in [0, 1]
- ✅ All links carry an explanation
- ✅ Low-confidence links correctly flagged for manual review

### Upload Readiness (2/2)
- ✅ All 10 checklist criteria present on every requirement
- ✅ Readiness percentage is in [0, 100]

### ReqIF generation (12/12)
- ✅ Internal `validateReqIF()` returns `valid: true`
- ✅ Output is well-formed XML (independently parsed with Python ElementTree)
- ✅ Root element is `REQ-IF`
- ✅ `REQ-IF-HEADER` present with creation-time and version
- ✅ `DATATYPES` block has ≥ 4 definitions
- ✅ `SPEC-OBJECT-TYPE` has ≥ 5 attribute definitions
- ✅ `SPEC-OBJECTS` count equals requirement count
- ✅ Every object types as `OT-REQ`
- ✅ Every object has all 5 mandatory attribute values (`AD-TITLE`, `AD-TEXT`, `AD-TYPE`, `AD-PRIO`, `AD-SOURCE`)
- ✅ Every `ENUM-VALUE-REF` resolves to a defined enum value
- ✅ Every `SPEC-OBJECT-REF` in the hierarchy resolves to a defined spec-object
- ✅ `SPEC-RELATIONS` count equals approved-link count

### Human-in-the-loop (1/1)
- ✅ All requirements start with status `review` — no auto-approval, no auto-import path exists

## Sample output

A successful run against the built-in spec produces:

| Metric | Value |
|---|---|
| Documents processed | 1 |
| Requirements extracted | 16 |
| Sections reconstructed | 5 |
| Ambiguous requirements | 2 |
| Duplicate candidates | 2 |
| Non-testable requirements | 3 |
| Traceability links suggested | 9 |
| Low-confidence links | 6 |
| ReqIF size | 40 KB / 574 lines |
| ReqIF spec-objects | 16 |
| Upload Readiness (pre-review) | 69 % |

The generated ReqIF is included in `samples/sample-output.reqif` for inspection.

## Bug fixed during validation

The validation harness caught a real defect in the compound-splitter: the subject regex was greedy and captured the modal verb itself, producing `"The pump shall shall log every bolus event."` The fix tightened the subject pattern with a non-modal lookahead. Both bug-detection and re-validation are recorded above.
