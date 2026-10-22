---
doc: spec
status: approved
---

# DriftShield AI — Technical Spec

## How This Works, In Plain Language
DriftShield AI is a client-side TypeScript workstation that protects applications against unexpected API schema changes. It takes an old and a new JSON payload, decomposes both into hierarchical key paths, and performs deterministic set and type comparisons. When differences are found, it categorizes them into breaking changes (deletions, type collisions), non-breaking additions, and restructured fields.

From these detected differences, it dynamically synthesizes TypeScript source code containing strict type definitions, an adapter function with defensive fallback lookups, type-conversion helpers, and runtime invariant assertions. To prove that the adapter works before a developer installs it, DriftShield executes the adapter function in an in-browser sandbox against both payloads and checks that the legacy contract is satisfied, rendering any mismatches in a visual diff inspector.

## The Core Journey Through the System
1. User interacts with `JsonEditor.tsx` or selects a preset from `Navbar.tsx` → `App.tsx` updates payload state.
2. `App.tsx` validates JSON strings via `JSON.parse()` within `useEffect` hooks.
3. User triggers `handleDetectDrift()` → calls `detectPayloadDrift()` in `src/utils/diffEngine.ts`.
4. `diffEngine.ts` generates `DriftItem[]` and `DriftSummary` metrics.
5. `App.tsx` passes drift data into `generateAdapterCode()` in `src/utils/adapterGenerator.ts` to produce the TypeScript adapter code string.
6. `App.tsx` invokes `runCompatibilitySuite()` in `src/utils/testRunner.ts`, executing the adapter against test fixtures in a secure sandbox.
7. `DriftReport.tsx`, `AdapterStudio.tsx`, and `TestPanel.tsx` render the visual analysis, code preview, and test diff results.
PRD ref: `prd.md > The Core Journey`.

## Stack
- **Language**: TypeScript 5.x / ES2022
- **Framework**: React 19 (SPA with React Hooks)
- **Bundler & Build**: Vite 8 with `@tailwindcss/vite`
- **Styling**: Tailwind CSS v4 (`@import "tailwindcss";` in `src/index.css`)
- **Icons**: `lucide-react`
- **Testing**: `tsx` running custom regression test suite (`src/utils/scenario3Regression.test.ts`)
- **Rationale**: React + Vite gives instant hot-reload and fast client-side rendering with zero backend overhead. Pure TypeScript utils enable 100% deterministic, offline execution with zero telemetry or cloud dependencies.

## Where It Runs and How Someone Tries It
- **Runtime**: Modern web browser (Chrome, Firefox, Safari, Edge) or Node.js 22 environment.
- **Port**: 3000 on host `0.0.0.0`.
- **Start Command**: `npm run dev`
- **Test Command**: `npm test`
- **Build Command**: `npm run build`
- **Lint Command**: `npm run lint`

## Look and Feel
- **Canvas**: Dark background (`#0b0f19`) with slate container surfaces (`#111827`, `#0d131f`).
- **Typography**: High-contrast sans-serif (`Plus Jakarta Sans`) paired with monospace (`JetBrains Mono`) for JSON keys, code snippets, and path diffs.
- **Accents**: Semantic status colors—Indigo (`#6366f1`) for primaries, Amber (`#f59e0b`) for drift warnings, Crimson (`#ef4444`) for breaking changes, and Emerald (`#10b981`) for passing tests.
- **Density**: Compact developer console layout maximizing information density while maintaining clean visual breathing room.

## Components

### `App.tsx`
Central state coordinator managing selected presets, payload text, JSON parse validation, drift analysis execution, adapter configuration, and test results.
PRD ref: `prd.md > Screens and Layout`.

### `Navbar.tsx`
Header bar containing application title, badge, preset selection dropdown, quick scenario buttons, and the primary "Detect Drift" action button.
PRD ref: `prd.md > Screens and Layout`.

### `JsonEditor.tsx`
Dual-column editor component with monospace text areas, line numbers, character counts, JSON format/beautify buttons, and inline syntax error alerts.
PRD ref: `prd.md > Dual JSON Payload Workspace`.

### `DriftReport.tsx`
Visual summary card displaying total drift, breaking changes, non-breaking additions, and ambiguous fields, followed by an interactive filterable list of individual drift items.
PRD ref: `prd.md > Deterministic Recursive Diff Engine`.

### `AdapterStudio.tsx`
Interactive code viewer displaying the synthesized TypeScript adapter with copy to clipboard, `.ts` file download, developer notice disclaimer, and conversion rule toggles.
PRD ref: `prd.md > Adapter Synthesis Studio`.

### `TestPanel.tsx`
Live compatibility test suite interface displaying test pass/fail status, runtime execution metrics, individual test case assertions, and field-level visual diff viewer.
PRD ref: `prd.md > Live Compatibility Test Suite`.

## Data Model

```typescript
// Core Drift Types (src/types/drift.ts)
export type DriftSeverity = 'BREAKING' | 'NON_BREAKING' | 'AMBIGUOUS';

export type DriftType =
  | 'FIELD_REMOVED'
  | 'FIELD_ADDED'
  | 'TYPE_CHANGED'
  | 'STRUCTURE_CHANGED'
  | 'FIELD_RENAMED';

export interface DriftItem {
  id: string;
  path: string;
  type: DriftType;
  severity: DriftSeverity;
  oldValue?: unknown;
  newValue?: unknown;
  oldType?: string;
  newType?: string;
  description: string;
  suggestedMapping?: string;
}

export interface DriftSummary {
  total: number;
  breaking: number;
  nonBreaking: number;
  ambiguous: number;
  hasAmbiguousAmount: boolean;
}

export type AmountConversionRule = 'CENTS_TO_DOLLARS' | 'PARSE_FLOAT' | 'KEEP_AS_STRING';

export interface AdapterConfig {
  amountRule: AmountConversionRule;
  strictTypes: boolean;
  includeRuntimeAssertions: boolean;
  allowPartial: boolean;
}

export interface TestCaseResult {
  id: string;
  name: string;
  description: string;
  passed: boolean;
  durationMs: number;
  errorMessage?: string;
  expectedContract?: Record<string, unknown>;
  output?: unknown;
  fieldMismatches?: Array<{
    field: string;
    expected: unknown;
    actual: unknown;
  }>;
}
```

## File Structure

```
driftshield-ai/
├── devpost/
│   ├── learner-profile.md     # Learner profile & context
│   ├── scope.md               # Scope & POC boundary
│   ├── prd.md                 # Product requirements document
│   ├── spec.md                # Technical specification
│   └── checklist.md           # Build verification checklist
├── src/
│   ├── components/
│   │   ├── AdapterStudio.tsx  # TypeScript adapter code viewer & config
│   │   ├── DriftReport.tsx    # Drift impact summary & item breakdown
│   │   ├── JsonEditor.tsx     # Dual monospaced JSON payload editor
│   │   ├── Navbar.tsx         # App bar & preset loader
│   │   └── TestPanel.tsx      # Compatibility test suite & diff viewer
│   ├── data/
│   │   └── samplePresets.ts   # Real-world drift scenarios (Payment, Webhook, Auth)
│   ├── types/
│   │   └── drift.ts           # Type definitions for drift, adapter & tests
│   ├── utils/
│   │   ├── adapterGenerator.ts# TypeScript adapter code synthesis engine
│   │   ├── diffEngine.ts      # Deterministic recursive schema diffing
│   │   ├── scenario3Regression.test.ts # Comprehensive test suite
│   │   └── testRunner.ts      # In-browser test runner & diff generator
│   ├── App.tsx                # Main application component
│   ├── index.css              # Global styles & Tailwind CSS v4 imports
│   └── main.tsx               # Application entry point
├── index.html                 # HTML entry with metadata & font imports
├── metadata.json              # AI Studio applet metadata
├── package.json               # Dependencies and npm scripts
├── tsconfig.json              # TypeScript compiler configuration
└── vite.config.ts             # Vite configuration with server host & port
```

## External Services and Dependencies
- **None**: DriftShield AI operates entirely client-side with deterministic algorithms. No external database, authentication provider, or third-party API keys are required.

## Important Failure Modes
- **Invalid JSON Syntax** → Real-time syntax validation catches parse errors with line and column markers, disabling drift execution and preventing unhandled crashes.
- **Extreme Payload Nesting / Circular References** → Diff engine utilizes guarded path flattening and depth-limited recursion to prevent stack overflows.
- **Unsafe Type Coercion (e.g. Cents vs Dollars)** → Adapter generator flags ambiguous monetary changes and generates defensive fallback lookups with developer-configurable conversion rules.

## What Was Simplified and Why
- **In-Memory Sandboxed Runner** instead of isolated Web Workers or Node VM — simplified client-side execution within a controlled JavaScript closure provides instantaneous test results without worker serialization friction.
- **Heuristic Path Distance Matching** instead of deep ML semantic embedding models — deterministic Levenshtein and token matching guarantees 100% reproducible, explainable field rename detections with zero latency.

## Decisions and Open Issues
- **Decision 1**: Enforced explicit unit conversion options for monetary properties rather than guessing between integer cents and dollar floats.
- **Decision 2**: Injected `PayloadCompatibilityError` runtime assertion class into synthesized adapters to fail fast on invalid production payloads.
- **Decision 3**: Designed comprehensive 7-stage regression test suite (`scenario3Regression.test.ts`) validating delimited strings, boolean flags, nested path adaptation, and error handling.
- **Open Issues**: None. All core requirements and test suites are verified.
