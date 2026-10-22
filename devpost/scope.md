---
doc: scope
status: approved
---

# DriftShield AI

Deterministic API & webhook payload drift detection and backward-compatibility adapter generator.

## The Unique Kernel
Instantly detects structural breaking changes between two JSON payloads and synthesizes a production-ready, type-safe TypeScript compatibility adapter with runtime invariant guards and a live verification test harness—all running 100% client-side with zero external dependencies.

## Who It's For
Backend and frontend software engineers, platform developers, and webhook consumers integrating with third-party SaaS APIs (Stripe, Shopify, GitHub, Segment) who need to prevent breaking schema changes from taking down downstream systems.

## The Core Loop
The developer pastes or loads an old and new JSON payload, reviews categorized breaking vs. non-breaking structural changes, inspects the synthesized TypeScript adapter with configurable monetary and type rules, and runs the live compatibility test suite to visually verify contract satisfaction.

## Inspiration & Identity
Modeled after high-contrast, developer-first engineering tools like Linear, Raycast, and Stripe Dashboard. Dark palette (`#0b0f19`), crisp hairline borders, JetBrains Mono typography for payloads and code, and high-visibility status indicators for breaking vs safe changes.

## Why This Matters to the Learner
Third-party API providers often introduce breaking field removals, rename paths, or switch types without sufficient notice. An automated tool that detects these shifts and generates defensive adapters prevents costly outages and eliminates tedious manual mapping boilerplate.

## What "Working" Looks Like
A developer pastes historical and updated payloads; DriftShield instantly computes the deep diff, flags breaking removals and type shifts, synthesizes a clean TypeScript adapter with defensive fallback chains, and executes a 3-test verification suite showing green checkmarks and exact field-level diffs.

## The POC Boundary
- Dual-pane JSON editors with syntax validation, line numbers, and sample presets (Payment drift, Webhook envelope restructuring, and Identity & permissions schema).
- Recursive structural diff engine categorizing added, removed, and type-mutated fields with similarity-based rename detection.
- TypeScript adapter generator with configurable amount conversion (cents-to-dollars vs float) and optional runtime invariant assertions.
- Live client-side test suite executing the adapter against both payloads with expected vs. adapted JSON comparison diffs.

## Later
- OpenAPI / JSON Schema export and automated GitHub PR bot integration.
- Custom AST transformation rules for language runtimes beyond TypeScript (e.g. Python, Go).
- Webhook receiver endpoint for live traffic capture and shadow diffing.

## Explicitly Cut
- Cloud database persistence (not needed for instant client-side developer utility; avoids unnecessary storage and auth overhead).
- Cloud LLM API dependencies for diffing (deterministic AST/tree diffing guarantees 100% reproducible, zero-hallucination results).
