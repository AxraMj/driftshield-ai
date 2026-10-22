# DriftShield AI

**Detect API schema drift, understand compatibility risks, and generate TypeScript adapters to help keep integrations working.**

## Live Demo

🚀 [Try DriftShield AI](https://driftshield-ai-tkl7.vercel.app/)

## Overview

DriftShield AI is a web application designed to help developers identify structural changes between API or webhook JSON payloads. It compares payloads, highlights schema differences, explains potential compatibility risks, and helps generate TypeScript adapters for handling changes between versions.

## The Problem

APIs and webhooks can change over time. Fields may be added or removed, data types may change, and previously required values may become optional. These changes can break downstream applications and integrations if they are not detected early.

Developers often need to compare payloads manually and determine how to handle compatibility issues.

## Our Solution

DriftShield AI provides a focused workflow for comparing JSON payloads and understanding potential schema compatibility issues. It helps developers identify changes and explore adapter code to handle differences between payload versions.

## Key Features

- **JSON Payload Comparison** — Compare old and new payload structures.
- **Schema Drift Detection** — Identify structural and data-type changes.
- **Compatibility Risk Analysis** — Understand potential risks associated with detected changes.
- **TypeScript Adapter Generation** — Generate adapter code to help handle schema differences.
- **Sample Scenarios** — Explore example payloads and common drift situations.
- **Verification Workflow** — Review the results and test the proposed compatibility handling.

## How It Works

1. Provide the old and new JSON payloads.
2. Run the drift detection workflow.
3. Review the detected schema changes.
4. Examine the compatibility risks.
5. Generate and review a TypeScript adapter.
6. Use the available verification workflow to assess the result.

## Technology Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Google GenAI SDK
- Lucide React
- Motion

## Getting Started

### Prerequisites

- Node.js
- npm
- Git

### Installation

Clone the repository:

```bash
git clone https://github.com/AxraMj/driftshield-ai.git
```

Move into the project directory:

```bash
cd driftshield-ai
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL displayed in your terminal.

### Build the Project

```bash
npm run build
```

### Run Type Checking

```bash
npm run lint
```

### Run Regression Tests

```bash
npm test
```

## Project Structure

```text
driftshield-ai/
├── devpost/
│   ├── learner-profile.md
│   ├── scope.md
│   ├── prd.md
│   ├── spec.md
│   └── checklist.md
├── src/
├── agent/
├── .agents/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

*The structure above highlights selected project files and directories.*

## Project Documentation

Project planning and development documents are available in the [`devpost/`](https://github.com/AxraMj/driftshield-ai/tree/main/devpost) directory:

- [Learner Profile](devpost/learner-profile.md)
- [Project Scope](devpost/scope.md)
- [Product Requirements](devpost/prd.md)
- [Technical Specification](devpost/spec.md)
- [Project Checklist](devpost/checklist.md)

## Current Status

DriftShield AI has a public repository and a deployed web demo. The project is focused on making API schema changes easier to identify, understand, and handle through generated TypeScript adapters.

## Future Improvements

Potential future enhancements include:

- Expanded schema compatibility rules.
- More detailed explanations of breaking and non-breaking changes.
- Additional adapter generation options.
- Broader test coverage and edge-case validation.
- Improved reporting and export options.

## Contributing

Contributions, suggestions, and feedback are welcome. You can explore the code, report issues, or propose improvements through the [GitHub repository](https://github.com/AxraMj/driftshield-ai).

## License

This project is licensed under the [MIT License](LICENSE).
