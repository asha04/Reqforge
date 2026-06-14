# Original Product Specification

This is the brief that ReqForge was built against.

## Objective

Build an application that enables users to upload Word and PDF specification documents and automatically convert them into DNG-ready requirements with traceability, hierarchy, validation, and ReqIF export capabilities for automotive engineering and vehicle system development.

The system should act as an intelligent requirements engineering assistant that helps automotive teams accelerate the conversion of unstructured system and subsystem specifications into structured DNG artifacts while maintaining traceability, quality, and functional safety considerations.

## User Workflow

1. User uploads one or more Word or PDF specification documents, including vehicle specifications, ECU software requirements, safety concept documents, or interface control documents.
2. User selects target DNG project, module/template, attribute schema, and an optional existing DNG baseline export.
3. Agent analyzes documents.
4. Agent extracts requirements.
5. Agent normalizes requirements into DNG-ready format.
6. Agent builds hierarchy and traceability relationships.
7. Agent identifies duplicates, conflicts, ambiguities, and gaps.
8. Agent presents a review interface.
9. User approves or edits requirements.
10. Agent generates ReqIF output.
11. Agent validates the generated ReqIF.
12. Agent produces a DNG Upload Readiness Score and conversion report.

## Document Processing Requirements

**Supported inputs:** PDF, DOCX, DOC, TXT, existing ReqIF exports, DNG exports for comparison.

**Extraction:** Extract requirements, preserve source traceability (document name, section, subsection, heading, page number, original source text), and ignore marketing content, boilerplate, table of contents, revision history, and non-requirement narrative.

This includes automotive content such as vehicle functional specifications, system architecture definitions, safety requirements, hardware/software interface descriptions, ECU communication protocols, and diagnostic requirements.

## Requirement Conversion Rules

Each requirement shall be atomic, represent a single requirement, use clear and testable language, use "shall" for mandatory requirements, avoid ambiguous language, avoid combining multiple requirements into a single statement, and preserve original intent.

The system shall never invent requirements not supported by source content, and shall maintain both original extracted text and converted DNG-ready text. For automotive usage, the tool should preserve safety-critical boundary conditions and architecture-related traceability while normalizing language to ISO-style DNG statements.

## Requirement Metadata

For every requirement: Requirement ID, Title, Requirement Text, Original Source Text, Requirement Type, Priority, Source Document, Source Section, Source Page, Parent Requirement, Confidence Score, Review Status, Notes.

## Requirement Classification

Functional, Non-Functional, Performance, Interface, Security, Safety, Compliance, Data, Operational, Constraint, Assumption, Open Question — with confidence scores.

## Hierarchy Generation

Reconstruct document hierarchy, create parent-child relationships, group related requirements, preserve document structure where possible, identify orphans, and flag uncertain hierarchy assignments.

## DNG Traceability Analysis

When existing DNG exports are provided, compare extracted requirements against existing DNG artifacts.

**Suggested link types:** Derives From, Refines, Satisfies, Traces To, Depends On, Conflicts With, Duplicate Of, Related To.

For each link: source requirement, target requirement, link type, confidence score, explanation. Low-confidence links require manual review.

## Quality Validation

- **Ambiguous Requirements** — fast, user-friendly, efficient, robust, appropriate
- **Duplicate Requirements** — exact, near, semantic
- **Conflicting Requirements** — contradictory behaviors, conflicting limits, conflicting priorities
- **Non-Testable Requirements** — lacking measurable acceptance criteria
- **Compound Requirements** — containing multiple independent requirements
- **Missing Information** — actors, conditions, constraints, acceptance criteria

## DNG Schema Validation

Validate required attributes populated, valid hierarchy, valid link types, valid object types, valid module structure, valid ReqIF schema mapping. Any failures reported before export.

## Review Workspace

View extracted requirements, compare original and rewritten, approve, reject, edit, merge duplicates, resolve conflicts, approve traceability links, preview DNG hierarchy, preview ReqIF output.

## Output Formats

- **Review Spreadsheet** — requirement data, validation status, confidence scores, traceability suggestions
- **JSON Output** — structured representation
- **ReqIF Output** — ready for DNG import
- **Executive Summary Report** — totals processed, extracted, approved, duplicates, conflicts, ambiguities, traceability links, DNG Upload Readiness Score

## DNG Upload Readiness Score

```
Upload Readiness % = (Upload-Ready Requirements ÷ Total Extracted Requirements) × 100
```

A requirement is upload-ready only when:
- Requirement statement exists
- Title exists
- Valid requirement type exists
- Mandatory attributes exist
- Source traceability exists
- Parent hierarchy is valid
- No unresolved conflicts
- No unresolved duplicates
- Passes DNG schema validation
- Passes ReqIF validation

## Dashboard Metrics

Documents Uploaded, Requirements Extracted, Approved, Requiring Review, Duplicate Candidates, Conflict Candidates, Ambiguous Requirements, Suggested Traceability Links, Upload Readiness %, ReqIF Validation Status.

## Human Review Requirements

The system shall never automatically import requirements into DNG. Human approval is required before requirement creation, modification, traceability creation, ReqIF export, and DNG upload.

## Success Criteria

The platform is considered successful when users can upload specifications with minimal preparation, requirements are automatically converted into DNG-ready format, ReqIF files validate successfully, traceability relationships are generated with confidence scoring, Upload Readiness % accurately reflects import quality, review effort is significantly reduced compared to manual DNG authoring, and generated outputs are suitable for enterprise-scale requirements management workflows.
