# DriftShield AI — Payload Drift Detection & Compatibility Engine

DriftShield AI protects production frontend and backend applications from breaking changes in API and webhook schemas. It compares historical and updated JSON payloads deterministically, pinpoints structural breaking changes, synthesizes type-safe TypeScript compatibility adapters, and executes live dual-payload test suites with granular visual diffs.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following core product workflows were confirmed during initial requirements alignment:

- **Confirmed Decision 1 (Adapter Generation Style)**: DriftShield generates modern, type-safe TypeScript adapters with strict interfaces, runtime null/undefined guards, and defensive validation. Generated adapters are explicitly marked as suggestions requiring developer sign-off.
- **Confirmed Decision 2 (Verification Engine)**: The interactive test runner executes the generated adapter against both the old and new payloads in a controlled sandbox, displaying live pass/fail status, structural assertions, and field-level visual diffs comparing expected vs adapted outputs.
- **Deterministic Core Guarantee**: Schema comparison, structural diffing, rename inference, type collision alerts, and test executions run 100% client-side with deterministic algorithms—requiring zero external keys or paid LLM dependencies for core operations.

---

### 1. Overview & Core Concept

- **What It Does**: DriftShield AI ingests an existing ("Old") and modified ("New") JSON payload, validates syntax with line/column pointers, executes deep recursive schema analysis, categorizes drift into severity tiers (breaking vs non-breaking), and automatically produces a drop-in adapter function that transforms incoming payloads into legacy shapes to prevent downstream outages.
- **Target Audience / Persona**: Frontend engineers, backend API consumers, and webhook integrators dealing with evolving SaaS APIs (e.g. Stripe, GitHub, Shopify, Segment, Twilio).
- **Key Value**: Eliminates silent production errors caused by unexpected field removals, nesting re-architectures, and type shifts (such as number cents vs string currency floats).

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Payload Entry & Validation**: Dual split JSON editors with syntax error highlights, line counts, JSON formatting/beautify buttons, and a 1-click "Load Sample Data" preset (featuring the exact customer id / amount drift scenario, plus multiple real-world presets like Webhook Event Migration and Nested Metadata Reorganization).
  2. **Drift Detection**: Instant deterministic analysis on clicking "Detect Drift". Results are categorized into Added Fields, Removed Fields, Type Mutations, and Renamed/Restructured candidates.
  3. **Impact Assessment**: High-visibility impact summary highlighting breaking vs non-breaking counts, accompanied by an explicit rule flag for unsafe automatic type conversions (e.g. `amount: 2500` [number] vs `"25.00"` [string]).
  4. **Adapter Generation**: Interactive code viewer featuring the generated TypeScript adapter, strict interface contracts, and customizable conversion strategy switches (e.g. amount currency unit conversion rules).
  5. **Dual-Payload Test Panel**: Single-click "Run Compatibility Suite" that executes the adapter against both payloads in real-time, verifying whether the legacy application contract is satisfied, rendering pass/fail metrics and an interactive JSON diff viewer.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Dark developer-tool workstation inspired by high-end developer consoles (Raycast, Linear, Datadog), prioritizing crisp contrast, dense scannability, and zero visual clutter.
  - *Color Palette & Mood*: Deep slate canvas (`#0b0f19`), elevated surface panels (`#111827` and `#1f2937`), fine hairline borders (`#374151`), with semantic status accents (Amber `#f59e0b` for warnings/drift, Crimson `#ef4444` for breaking removals, Emerald `#10b981` for safe additions & test passes, and Indigo `#6366f1` for active actions).
  - *Typography & Hierarchy*: High-legibility sans-serif for headings and UI controls, paired with `JetBrains Mono` / monospace with `tabular-nums` for all JSON keys, code snippets, path queries, and test assertions.
  - *Anti-Slop Discipline*: Zero floating pills for static metadata; clean typography with `·` dividers; zero code comment headers; zero fake telemetry tickers; all controls wired to functioning state.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Deterministic vs Pure AI Drift Engine**:
  - *Chosen Approach*: Pure deterministic tree-traversal and Levenshtein/heuristic path distance matching for field rename/nesting detection, combined with strict JSON schema inference.
  - *Why*: Developers require 100% reproducible, fast, and explainable diffs without hallucination risks or network dependencies.
  - *Trade-off*: Complex semantic renaming across unrelated vocabulary requires clear heuristic scoring and user review toggles.
- **Decision 2: Safe Unit & Type Handling (Amount Guard)**:
  - *Chosen Approach*: As mandated, DriftShield does not blindly parse `"25.00"` to `2500` without explicit user intent. It flags the type change as a breaking ambiguity, warns that units may have shifted from cents to dollars, and provides an interactive toggle in the adapter config (`Keep as parsed string`, `Multiply string float by 100 to integer cents`, `Custom conversion logic`).
  - *Why*: Automated guesses on financial or metric units cause severe production accounting bugs.
- **Decision 3: Safe Client-Side Test Runner Sandbox**:
  - *Chosen Approach*: Compile and evaluate the generated adapter function inside an isolated function scope with try/catch and deep equality assertions against expected contracts.
  - *Why*: Instant test runs without backend roundtrips; gives immediate feedback to the engineer.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                          DriftShield AI App                            │
├────────────────────────────────────────────────────────────────────────┤
│  Top Navigation: App Title & Wordmark · Preset Picker · Action Bar     │
├────────────────────────────────────────────────────────────────────────┤
│  Workspace (Responsive Dual-Column Grid):                              │
│  ┌───────────────────────────────┐  ┌────────────────────────────────┐ │
│  │   Old API / Webhook Payload   │  │    New API / Webhook Payload   │ │
│  │   - JSON Syntax Validation    │  │    - JSON Syntax Validation    │ │
│  │   - Line Numbers & Format     │  │    - Line Numbers & Format     │ │
│  └───────────────────────────────┘  └────────────────────────────────┘ │
│                                  │                                     │
│                     [ Detect Schema Drift ]                            │
│                                  │                                     │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ Drift Analysis Summary & Impact Matrix                            │ │
│  │ - Breaking Changes: Removed fields, Type collisions, Structure    │ │
│  │ - Non-Breaking: Added nullable fields                             │ │
│  │ - Ambiguity Flag: e.g. amount (number -> string unit check)       │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                  │                                     │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ TypeScript Compatibility Adapter Studio                           │ │
│  │ - Generated Interface contracts (OldPayload, NewPayload)          │ │
│  │ - Safe Normalizer function: adaptPayload(raw: unknown)            │ │
│  │ - Configurable conversion rules & Copy / Download action          │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                  │                                     │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ Interactive Dual-Payload Test Suite                               │ │
│  │ - Run Adapter on Old Payload -> Verify Invariant Retention        │ │
│  │ - Run Adapter on New Payload -> Verify Downstream Legacy Fit      │ │
│  │ - Diff inspector: Expected vs Adapted Result                      │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

- **Core Modules**:
  1. `src/utils/diffEngine.ts`: Deterministic JSON path flattening, type checking, added/removed/type-changed classification, and structural similarity analysis for nested field migrations.
  2. `src/utils/adapterGenerator.ts`: Synthesizes TypeScript interfaces, property fallbacks, defensive optional chaining, and customizable conversion handlers.
  3. `src/utils/testRunner.ts`: Executes actual evaluation of the adapter function with test assertions, execution timings, and JSON diff calculation.
  4. `src/components/JsonEditor.tsx`: Responsive monospaced editor with error markers, line numbers, and sample data controls.
  5. `src/components/DriftReport.tsx`: Scannable breakdown of detected drift grouped by severity and path.
  6. `src/components/AdapterViewer.tsx`: Syntax-highlighted adapter display with copy/export and conversion configuration.
  7. `src/components/TestPanel.tsx`: Live dual-payload test runner with visual diffs and assertion results.
