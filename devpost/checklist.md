---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast

## Slices

- [x] **1. Dual JSON Payload Editors with Syntax Validation**
  Becomes usable: Interactive side-by-side JSON editors with line numbers, formatting, character counts, and real-time syntax error validation.
  Why now: The payload editor is the primary input surface upon which all downstream diffing and adapter generation depends.
  PRD ref: `prd.md > Dual JSON Payload Workspace`
  Spec ref: `spec.md > Components (JsonEditor.tsx)`
  Build: Created `src/components/JsonEditor.tsx` with responsive layout, syntax checking, and preloaded sample presets in `src/data/samplePresets.ts`.
  Verify (mechanical): Tested with valid and malformed JSON; verified line/error messages render and invalid inputs cleanly block diff execution.
  Learner check: Paste invalid JSON and verify the red syntax banner displays the exact error message.
  Commit: `Add dual JSON payload editors with live syntax validation`

- [x] **2. Deterministic Recursive Schema Diff Engine**
  Becomes usable: Deep structural analysis between historical and updated payloads detecting additions, removals, type changes, and restructured paths.
  Why now: Core unique kernel of DriftShield AI; required before generating any adapter logic.
  PRD ref: `prd.md > Deterministic Recursive Diff Engine`
  Spec ref: `spec.md > Components (diffEngine.ts)`
  Build: Created `src/utils/diffEngine.ts` with recursive path flattening, type classification, severity scoring, and heuristic rename detection.
  Verify (mechanical): Tested across 3 sample presets; verified breaking removals, type mutations, and non-breaking additions are correctly categorized.
  Learner check: Click "Detect Drift" and inspect the categorized drift cards and severity metrics in `DriftReport.tsx`.
  Commit: `Implement deterministic payload diff engine and drift report`

- [x] **3. TypeScript Compatibility Adapter Synthesis Engine**
  Becomes usable: Auto-generation of production-ready, type-safe TypeScript adapters normalizing updated payloads back into legacy application contracts.
  Why now: Directly solves the user problem by outputting actionable, copy-pasteable compatibility code.
  PRD ref: `prd.md > Adapter Synthesis Studio`
  Spec ref: `spec.md > Components (adapterGenerator.ts, AdapterStudio.tsx)`
  Build: Created `src/utils/adapterGenerator.ts` and `src/components/AdapterStudio.tsx` with interface synthesis, fallback chaining, amount conversion rules, and runtime invariant assertions.
  Verify (mechanical): Verified generated code contains strict types, fallback lookups, and helper functions; checked copy to clipboard and `.ts` download buttons.
  Learner check: Switch amount conversion rule between Cents-to-Dollars and Parse Float and observe real-time code updates.
  Commit: `Add TypeScript compatibility adapter synthesis studio`

- [x] **4. Live Compatibility Test Suite & Visual Diff Runner**
  Becomes usable: In-browser test runner executing the synthesized adapter against old and new payloads with pass/fail metrics and field-level visual diffs.
  Why now: Gives developers immediate visual proof that the synthesized adapter preserves legacy contracts before shipping.
  PRD ref: `prd.md > Live Compatibility Test Suite`
  Spec ref: `spec.md > Components (testRunner.ts, TestPanel.tsx)`
  Build: Created `src/utils/testRunner.ts` and `src/components/TestPanel.tsx` executing forward compatibility, legacy invariant, and runtime assertion test cases.
  Verify (mechanical): Clicked "Run Compatibility Suite"; confirmed all tests pass with execution timings and visual diff inspector.
  Learner check: Run test suite and inspect expected vs adapted output in the diff inspector.
  Commit: `Add live compatibility test suite and visual diff inspector`

- [x] **5. Comprehensive Regression Test Suite & Scenario Verification**
  Becomes usable: Automated regression test suite verifying complex drift edge cases (delimited string-to-array, boolean-to-integer, envelope unwrapping).
  Why now: Ensures mission-critical transformation accuracy and prevents regressions across complex real-world payload schemas.
  PRD ref: `prd.md > States and Boundaries`
  Spec ref: `spec.md > Testing (scenario3Regression.test.ts)`
  Build: Created `src/utils/scenario3Regression.test.ts` covering helper functions, evidence predicates, and end-to-end verification across all 3 scenarios.
  Verify (mechanical): Executed `npm test`; verified 100% assertions pass across all 7 test stages.
  Learner check: Run `npm test` in the terminal and verify all regression tests pass.
  Commit: `Add comprehensive regression test suite for complex schema drift`

## Hands-on Checkpoints

- [x] Early usable behavior explored — Dual payload editor and deterministic diff engine verified with real-world sample presets.
- [x] Final kick-the-tires exploration and feedback completed — Adapter generation, rule customization, and dual-payload test suite verified end-to-end.

## Final Review

- [x] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [x] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [x] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [x] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: Verified all 5 project slices and regression test suites in `src/utils/scenario3Regression.test.ts`. Confirmed clean Vite compilation, zero lint errors, and responsive dark-mode developer UI.
Route and stops:
- `src/App.tsx`: Central coordinator connecting editor state, diff engine, adapter generator, and test panel.
- `src/utils/diffEngine.ts`: Deterministic recursive path traversal and structural drift classification.
- `src/utils/adapterGenerator.ts`: TypeScript AST/code synthesis with defensive fallbacks and configurable conversion rules.
- `src/utils/testRunner.ts`: Sandboxed adapter execution harness with field-level diff detection.
- `src/utils/scenario3Regression.test.ts`: Regression test suite validating all real-world drift patterns.
Edit outcome: Clean migration to AI Studio with standardized Vite configuration and environment setup.
Reflection: Deterministic schema comparison and defensive adapter generation eliminate runtime failures during API migrations without relying on external network dependencies.
Activity mode: live app and editor

## Revisions
