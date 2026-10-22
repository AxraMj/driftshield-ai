---
doc: prd
status: approved
---

# DriftShield AI — Product Requirements

Deterministic payload drift detection and compatibility adapter synthesis engine for API and webhook developers.
Source: `scope.md > DriftShield AI`.

## The Core Journey
1. **Arrival & Preset Selection**: The developer opens DriftShield AI and selects one of the pre-configured real-world scenarios (e.g. Customer & Amount Drift, Webhook v1 to v2 Envelope, or Identity & Permissions Schema) or pastes their own payloads.
2. **Payload Validation**: The dual-pane JSON editor checks both payloads in real time, displaying syntax errors with line/column markers or confirming valid JSON structure.
3. **Drift Detection & Categorization**: The user clicks "Detect Drift" (or selects a preset); the diff engine recursively traverses both payloads, identifies additions, removals, type mutations, and path restructuring, and displays a categorized impact report.
4. **Adapter Configuration & Inspection**: The developer inspects the synthesized TypeScript adapter, toggling conversion rules (e.g., Dollar String to Integer Cents ×100 vs. Parse Float) and runtime invariant assertions.
5. **Live Verification Test Suite**: The developer runs the compatibility test suite to execute the adapter against both old and new payloads in a client-side sandbox, confirming forward compatibility, legacy contract preservation, and schema invariant checks with visual diffs.
6. **Code Export**: The developer copies the TypeScript adapter to the clipboard or downloads `payload-compatibility-adapter.ts` for immediate production use.

## Screens and Layout
A unified single-page developer workstation:
- **Top Navigation Bar**: Brand identity (`DriftShield AI`), active preset picker dropdown, quick scenario presets, and "Detect Drift" primary CTA.
- **Hero & Mission Header**: Scannable summary of active defense status, breaking change counters, and quick navigation anchors.
- **Dual JSON Payload Editor**: Side-by-side monospaced editors for "Legacy (Old) Payload" and "Incoming (New) Payload" with format buttons, character/line counters, and inline parse error banners.
- **Drift Analysis Matrix**: Severity summary badges (Total Drift, Breaking, Non-Breaking, Ambiguities), followed by grouped drift item cards detailing path, mutation type, and legacy vs incoming values.
- **TypeScript Compatibility Adapter Studio**: Code viewer with syntax formatting, copy/download actions, developer review disclaimer, and interactive conversion rule selectors.
- **Compatibility Verification Test Suite**: Interactive test runner with pass rate indicator, execution runtime timing, individual test case status badges, and interactive visual diff inspection.

## Look and Feel
- **Theme**: Deep developer dark mode (`#0b0f19` background, `#111827` surface panels, `#1e293b` borders).
- **Typography**: Sans-serif (`Plus Jakarta Sans`) for UI controls and headers; high-clarity monospaced (`JetBrains Mono`) for JSON keys, code snippets, and diff view.
- **Color Accents**: Indigo (`#6366f1`) for actions; Amber (`#f59e0b`) for warnings and ambiguities; Crimson (`#ef4444`) for breaking changes; Emerald (`#10b981`) for passing tests and safe additions.
- **Tone**: Professional, precise, technical, zero-fluff developer tooling.

## Features and Behavior

### Dual JSON Payload Workspace
- Formats and validates JSON strings in real-time.
- Displays line numbers, character counts, and precise syntax error messages.
- Provides presets for immediate exploration of common real-world drift patterns.

### Deterministic Recursive Diff Engine
- Computes flattened path representations of arbitrary nested objects and arrays.
- Flags removed required fields as BREAKING.
- Flags type changes (e.g., number to string, array to string, boolean to integer) as BREAKING.
- Flags added fields as NON_BREAKING additions.
- Uses path token similarity and structural matching to identify renamed or restructured fields (e.g. `customer_id` -> `customer.id`).

### Adapter Synthesis Studio
- Generates fully typed TypeScript interface contracts: `LegacyPayload`, `IncomingPayload`, and `AdaptedPayload`.
- Synthesizes an exported `adaptPayload(raw: unknown): LegacyPayload` function.
- Implements defensive optional chaining and fallback paths: `raw?.customer?.id ?? raw?.customer_id`.
- Supports configurable monetary conversion rules (`CENTS_TO_DOLLARS`, `PARSE_FLOAT`, `KEEP_AS_STRING`).
- Includes helper parsers: `parseDelimitedStringToArray`, `parseBooleanToIntegerFlag`.
- Injects `PayloadCompatibilityError` runtime assertion checks for critical fields when enabled.

### Live Compatibility Test Suite
- Test 1 (Forward Compatibility): Evaluates adapter on new payload and verifies all legacy fields are present and correctly typed.
- Test 2 (Legacy Contract Invariant): Evaluates adapter on legacy payload to guarantee zero regression on historical data.
- Test 3 (Assertion & Boundary Check): Tests resilience against null/empty payloads and verifies that runtime invariant guards behave predictably.
- Interactive JSON Diff Inspector: Highlights field-level mismatches with expected vs actual values.

## States and Boundaries
- **First Use / Default**: Loads Preset 1 ("Customer & Amount Drift") pre-populated with old and new payloads, pre-analyzed drift report, and passing test results.
- **Syntax Error State**: When an invalid JSON string is entered, disables drift analysis and renders a red syntax error callout below the affected editor pane.
- **Stale State**: When payloads are modified after analysis, flags the report as stale with an alert prompting re-analysis.
- **Empty Payload State**: Prompts user with placeholder hints when editor panes are cleared.

## Product Decisions
- **Deterministic diffing over LLM**: Chose 100% reproducible AST/path diffing for zero latency, zero hallucinations, and zero API key requirements.
- **Explicit unit ambiguity warnings**: Monetary shifts between float dollars and integer cents are flagged as high-risk ambiguities requiring developer confirmation rather than automatic silent coercion.
- **Developer Review Disclaimer**: Synthesized adapters are marked as suggested transformations with advice to perform manual code review before production deployment.

## What We're Building
A complete client-side single-page developer workstation containing payload editors, deterministic diff engine, adapter generator, and interactive test runner.

## Deferred From the POC
- Multi-file code generation and zip bundling.
- Language targets other than TypeScript (Python Pydantic, Go structs, Rust serde).
- Git repository webhook integration.

## Possible Later Enhancements
- Visual drag-and-drop field mapping editor.
- Automated PR creation with generated adapter and Jest/Vitest tests.
- Schema registry sync (Confluent, AWS EventBridge, Swagger/OpenAPI).

## Non-Goals
- Full API gateway or reverse proxy runtime.
- Paid cloud storage or user database accounts.
- Replacing comprehensive end-to-end integration test suites.

## Open Questions
- None blocking. All core schema conversion patterns and regression scenarios are implemented and validated.
