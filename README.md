# DriftShield AI

**Detect API payload drift before it breaks production.**

DriftShield AI is a developer-focused tool for comparing historical and incoming API or webhook payloads, identifying structural changes, explaining compatibility risks, and generating TypeScript compatibility adapters.

## The Problem

API responses and webhook payloads can change over time. Fields may be removed, types may change, or nested structures may be reorganized. These changes can break downstream consumers if they are not detected and handled carefully.

DriftShield AI helps developers inspect payload changes and evaluate compatibility before integrating updated data.

## Features

- **Side-by-side payload comparison** — Compare old and new JSON payloads.
- **Schema drift detection** — Identify field additions, removals, structural changes, and type changes.
- **Compatibility risk analysis** — Highlight potentially breaking changes.
- **TypeScript adapter generation** — Generate compatibility adapters to help handle payload changes.
- **Verification suite** — Test compatibility against sample scenarios.
- **Sample scenarios** — Explore example API and webhook payload changes.

## Application Screenshots

Screenshots of the application will be added here to demonstrate the payload workspace, drift analysis, adapter generation, and verification workflow.

<!-- Add screenshots after uploading them to a folder such as docs/screenshots/. -->

## How It Works

1. Load or enter an existing JSON payload.
2. Provide the incoming or updated payload.
3. Run drift detection to inspect structural and type differences.
4. Review the detected changes and compatibility risks.
5. Generate and review a TypeScript compatibility adapter.
6. Run the available verification scenarios.

The exact behavior depends on the current implementation and supported sample scenarios.

## Technology Stack

- React
- TypeScript
- Vite
- CSS

## Getting Started

### Prerequisites

- Node.js
- npm

### Installation

Clone the repository and install its dependencies:

```bash
git clone https://github.com/AxraMj/driftshield-ai.git
cd driftshield-ai
npm install
```

### Run the Development Server

```bash
npm run dev
```

Open the local URL printed by Vite in your terminal.

### Build the Application

```bash
npm run build
```

Check `package.json` for the available scripts and project-specific requirements.

## Project Planning and Documentation

The [`devpost/`](devpost/) directory contains the project planning documents:

- [`Learner Profile`](devpost/learner-profile.md)
- [`Project Scope`](devpost/scope.md)
- [`Product Requirements`](devpost/prd.md)
- [`Technical Specification`](devpost/spec.md)
- [`Build Checklist`](devpost/checklist.md)

These documents describe the intended scope, requirements, architecture, and implementation workflow.

## Current Status

DriftShield AI is under active development. Please refer to the source code and the available verification steps to assess the current implementation.

## License

See the [`LICENSE`](LICENSE) file for license terms once it has been added to the repository.
