# ReqForge Component & Data Flow Diagrams

## High-Level System Architecture

```mermaid
graph TB
    subgraph UI["User Interface Layer"]
        Upload["Upload/Paste Spec"]
        Review["Interactive Review WS"]
        Export["Export Outputs"]
    end

    subgraph Pipeline["Requirements Pipeline"]
        Parse["1. Parse Document<br/>(Structure Detection)"]
        Extract["2. Extract Candidates<br/>(Modal Verb Detection)"]
        Normalize["3. Normalize<br/>(DNG Conversion)"]
        Classify["4. Classify<br/>(12 Types)"]
        BuildHier["5. Build Hierarchy<br/>(Section Nesting)"]
        Validate["6. Validate Quality<br/>(Ambiguity, Dups, Conflicts)"]
        Trace["7. Build Traceability<br/>(Link Generation)"]
        GenReqIF["8. Generate ReqIF<br/>(XML Emission)"]
    end

    subgraph Outputs["Output Formats"]
        ReqIF["ReqIF 1.0 XML<br/>(DNG Import-Ready)"]
        CSV["CSV Export<br/>(Spreadsheet)"]
        JSON["Structured JSON<br/>(Machine-Readable)"]
    end

    subgraph External["External Systems"]
        DNG["DOORS Next Gen<br/>(Manual Upload)"]
        Baseline["Baseline ReqIF<br/>(Traceability)"]
    end

    Upload --> Parse
    Parse --> Extract
    Extract --> Normalize
    Normalize --> Classify
    Classify --> BuildHier
    BuildHier --> Validate
    Validate --> Trace
    Trace --> GenReqIF

    Baseline -.->|Optional| Trace

    GenReqIF --> ReqIF
    GenReqIF --> CSV
    GenReqIF --> JSON

    Review --> Validate
    Review --> Trace
    Review --> Export

    ReqIF --> DNG
    CSV --> DNG
    JSON --> DNG
```

## Detailed Pipeline Data Flow

```mermaid
graph LR
    RawText["Raw Text Input"] -->|parseDocument| DocStructure["Structured Doc<br/>{kind, heading, body, path}"]
    
    DocStructure -->|extractCandidates| Candidates["Requirement Candidates<br/>(Modal Verbs Found)"]
    
    Candidates -->|normalize| Normalized["DNG-Ready Reqs<br/>{text, title, original}"]
    
    Normalized -->|classify| Classified["Classified Reqs<br/>{type, typeConf, priority}"]
    
    Classified -->|buildHierarchy| Hierarchy["Hierarchical Tree<br/>(Sections + Reqs)"]
    
    Hierarchy -->|validate| Validated["Validated Reqs<br/>{flags, ready}"]
    
    Baseline["Baseline Reqs<br/>(Optional)"] -->|buildTraceability| Traces["Traceability Links<br/>{type, confidence}"]
    Validated --> Traces
    
    Traces -->|generateReqIF| ReqIF["ReqIF XML<br/>(OMG 1.0 Schema)"]
    
    ReqIF -->|validateReqIF| FinalOutput["Validated Output<br/>{valid, errors}"]
```

## Component Interaction Diagram

```mermaid
graph TD
    Browser["Browser Engine<br/>(HTML5, ES6+, DOM)"]
    
    subgraph App["Application Code"]
        UI["UI Controller<br/>(Events, DOM Manipulation)"]
        Pipeline["Pipeline Executor<br/>(Orchestrates 8 Stages)"]
        DataModel["Data Model<br/>(Requirement, Hierarchy, Link)"]
        Validators["Validation Engine<br/>(Quality Checks)"]
        ReqIFEmitter["ReqIF Emitter<br/>(XML Builder)"]
    end

    subgraph Libs["Browser APIs"]
        TextAPI["TextDecoder<br/>(Text Parsing)"]
        DOMParser["DOMParser<br/>(XML Validation)"]
        FileAPI["File API<br/>(Upload Handling)"]
    end

    subgraph Utils["Utility Functions"]
        PatternMatch["Pattern Matching<br/>(Regex, Modal Verbs)"]
        Similarity["Similarity Analysis<br/>(Jaccard, Token Sets)"]
        Hierarchy["Hierarchy Builder<br/>(Nesting, Orphan Detection)"]
    end

    Browser --> UI
    UI --> Pipeline
    Pipeline --> DataModel
    Pipeline --> Validators
    Validators --> ReqIFEmitter
    
    Pipeline -.-> PatternMatch
    Validators -.-> Similarity
    Hierarchy -.-> Hierarchy
    
    ReqIFEmitter -.-> DOMParser
    UI -.-> FileAPI
    Pipeline -.-> TextAPI
```

## Requirement Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> Extracted: Modal Verb Found
    
    Extracted --> Normalized: Converted to Shall-Form
    Normalized --> Classified: Type & Priority Assigned
    Classified --> Validated: Quality Checks Run
    
    Validated --> Review: Status = "review"
    Review --> Approved: User Approves
    Review --> Rejected: User Rejects
    Review --> Edited: User Modifies
    Edited --> Review
    
    Approved --> TraceReview: Traceability Links Generated
    TraceReview --> ReadyForUpload: All Links Approved
    ReadyForUpload --> ReqIFExported: Included in ReqIF
    
    Rejected --> [*]
    ReqIFExported --> DNGUploaded: Manual DNG Import
    DNGUploaded --> [*]
```

## Tech Stack Layers

```mermaid
graph TB
    subgraph L1["Presentation Layer"]
        HTML["HTML5"]
        CSS["CSS3"]
        DOM["DOM APIs"]
    end

    subgraph L2["Application Logic"]
        JS["JavaScript ES6+<br/>(No Build Tool)"]
        Pipeline["Pipeline Engine<br/>(8 Stages)"]
        State["State Management<br/>(In-Memory Objects)"]
    end

    subgraph L3["Data & Algorithms"]
        Regex["Regular Expressions<br/>(Modal Verbs, Headings)"]
        Jaccard["Jaccard Similarity<br/>(Duplicates, Traces)"]
        Hierarchy["Tree Traversal<br/>(Nesting)"]
    end

    subgraph L4["Output & Validation"]
        ReqIFGen["ReqIF Generator<br/>(XML Builder)"]
        DOMValidate["DOM Validation<br/>(Native Parser)"]
        Export["Export Formats<br/>(CSV, JSON)"]
    end

    subgraph L5["Runtime & Tools"]
        Browser["Web Browser"]
        Node["Node.js<br/>(Headless Testing)"]
        Git["Git / GitHub<br/>(Versioning)"]
    end

    L1 --> L2
    L2 --> L3
    L3 --> L4
    L4 --> L5
```

## Automotive-Specific Traceability Links

```mermaid
graph TD
    SysReq["System Requirement<br/>(Vehicle Level)"]
    
    SysReq -->|Refines| SubsysReq["Subsystem Requirement<br/>(ECU / Module)"]
    SubsysReq -->|Derives From| SwReq["Software Requirement<br/>(SW Component)"]
    SwReq -->|Satisfies| HwReq["Hardware Requirement<br/>(HW Component)"]
    
    SysReq -->|Traces To| SafetyReq["Safety Requirement<br/>(ISO 26262 ASIL)"]
    SafetyReq -->|Conflicts With| ConflictReq["Conflicting Constraint"]
    
    SwReq -->|Related To| TestReq["Test Requirement<br/>(V&V)"]
    HwReq -->|Depends On| InterfaceReq["Interface Requirement<br/>(CAN, LIN, etc.)"]
    
    TestReq -->|Duplicate Of| OtherTest["Similar Test Req"]
```

---

## Single-File Deployment Model

```
index.html (single file ~3000 lines)
├── <meta charset, viewport, styles>
├── <HTML structure (container divs, form fields)>
├── <script type="module">
│   ├── parseDocument()
│   ├── extractCandidates()
│   ├── normalize()
│   ├── classify()
│   ├── buildHierarchy()
│   ├── validate()
│   ├── buildTraceability()
│   ├── generateReqIF()
│   ├── validateReqIF()
│   └── Event listeners (upload, review, export)
└── </script>
```

**No build step, no bundler, no external dependencies.**
Ship to production as-is.
Works offline. Runs in any modern browser.

