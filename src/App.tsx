/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AlertTriangle,
  Code2,
  FileCode,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { JsonEditor } from './components/JsonEditor';
import { DriftReport } from './components/DriftReport';
import { AdapterStudio } from './components/AdapterStudio';
import { TestPanel } from './components/TestPanel';
import { SAMPLE_PRESETS } from './data/samplePresets';
import { detectPayloadDrift } from './utils/diffEngine';
import { generateAdapterCode } from './utils/adapterGenerator';
import { runCompatibilitySuite } from './utils/testRunner';
import {
  AdapterConfig,
  DriftItem,
  DriftSummary,
  SamplePreset,
  TestCaseResult,
} from './types/drift';

export default function App() {
  const defaultPreset = SAMPLE_PRESETS[0];

  const [selectedPresetId, setSelectedPresetId] = useState<string>(defaultPreset.id);
  const [oldJsonText, setOldJsonText] = useState<string>(defaultPreset.oldPayload);
  const [newJsonText, setNewJsonText] = useState<string>(defaultPreset.newPayload);

  const [oldSyntaxError, setOldSyntaxError] = useState<string | null>(null);
  const [newSyntaxError, setNewSyntaxError] = useState<string | null>(null);

  // Parsed JSON objects
  const [oldParsed, setOldParsed] = useState<unknown>(null);
  const [newParsed, setNewParsed] = useState<unknown>(null);

  // Analysis state
  const [driftItems, setDriftItems] = useState<DriftItem[]>([]);
  const [driftSummary, setDriftSummary] = useState<DriftSummary | null>(null);
  const [isAnalyzed, setIsAnalyzed] = useState<boolean>(false);
  const [isStale, setIsStale] = useState<boolean>(false);

  // Adapter configuration
  const [adapterConfig, setAdapterConfig] = useState<AdapterConfig>({
    amountRule: 'CENTS_TO_DOLLARS',
    strictTypes: true,
    includeRuntimeAssertions: true,
    allowPartial: false,
  });

  // Test suite state
  const [testResults, setTestResults] = useState<TestCaseResult[] | null>(null);
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);

  // Validate Old JSON on edit
  useEffect(() => {
    try {
      const parsed = JSON.parse(oldJsonText);
      setOldParsed(parsed);
      setOldSyntaxError(null);
    } catch (err: unknown) {
      setOldParsed(null);
      setOldSyntaxError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  }, [oldJsonText]);

  // Validate New JSON on edit
  useEffect(() => {
    try {
      const parsed = JSON.parse(newJsonText);
      setNewParsed(parsed);
      setNewSyntaxError(null);
    } catch (err: unknown) {
      setNewParsed(null);
      setNewSyntaxError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  }, [newJsonText]);

  // Handle manual edits triggering stale analysis flag
  const handleOldJsonChange = (val: string) => {
    setOldJsonText(val);
    if (isAnalyzed) {
      setIsStale(true);
    }
  };

  const handleNewJsonChange = (val: string) => {
    setNewJsonText(val);
    if (isAnalyzed) {
      setIsStale(true);
    }
  };

  const hasValidPayloads = oldSyntaxError === null && newSyntaxError === null && oldParsed !== null && newParsed !== null;

  // Execute Drift Detection
  const handleDetectDrift = useCallback(() => {
    if (!hasValidPayloads || !oldParsed || !newParsed) return;

    const { items, summary } = detectPayloadDrift(oldParsed, newParsed);
    setDriftItems(items);
    setDriftSummary(summary);
    setIsAnalyzed(true);
    setIsStale(false);

    // Run tests automatically on fresh analysis
    const initialTestResults = runCompatibilitySuite(oldParsed, newParsed, items, adapterConfig);
    setTestResults(initialTestResults);
  }, [hasValidPayloads, oldParsed, newParsed, adapterConfig]);

  // Run initial detection on mount
  useEffect(() => {
    if (oldParsed && newParsed && !isAnalyzed) {
      handleDetectDrift();
    }
  }, [oldParsed, newParsed, isAnalyzed, handleDetectDrift]);

  // Load sample preset
  const handleSelectPreset = (preset: SamplePreset) => {
    setSelectedPresetId(preset.id);
    setOldJsonText(preset.oldPayload);
    setNewJsonText(preset.newPayload);
    setIsStale(false);

    try {
      const pOld = JSON.parse(preset.oldPayload);
      const pNew = JSON.parse(preset.newPayload);
      setOldParsed(pOld);
      setNewParsed(pNew);
      setOldSyntaxError(null);
      setNewSyntaxError(null);

      const { items, summary } = detectPayloadDrift(pOld, pNew);
      setDriftItems(items);
      setDriftSummary(summary);
      setIsAnalyzed(true);

      const suiteResults = runCompatibilitySuite(pOld, pNew, items, adapterConfig);
      setTestResults(suiteResults);
    } catch {
      setIsAnalyzed(false);
      setTestResults(null);
    }
  };

  // Re-run test suite when adapterConfig changes
  useEffect(() => {
    if (isAnalyzed && oldParsed && newParsed) {
      const results = runCompatibilitySuite(oldParsed, newParsed, driftItems, adapterConfig);
      setTestResults(results);
    }
  }, [adapterConfig, isAnalyzed, oldParsed, newParsed, driftItems]);

  // Run Test Suite handler
  const handleRunTests = () => {
    if (!oldParsed || !newParsed) return;
    setIsRunningTests(true);
    setTimeout(() => {
      const results = runCompatibilitySuite(oldParsed, newParsed, driftItems, adapterConfig);
      setTestResults(results);
      setIsRunningTests(false);
    }, 150);
  };

  // Generate adapter code string
  const adapterCode = useMemo(() => {
    if (!oldParsed || !newParsed) return '// Awaiting valid JSON payloads...';
    return generateAdapterCode(oldParsed, newParsed, driftItems, adapterConfig);
  }, [oldParsed, newParsed, driftItems, adapterConfig]);

  const currentPreset = SAMPLE_PRESETS.find(p => p.id === selectedPresetId) || defaultPreset;

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        onDetectDrift={handleDetectDrift}
        onSelectPreset={handleSelectPreset}
        selectedPresetId={selectedPresetId}
        hasValidPayloads={hasValidPayloads}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Hero Banner / Workspace Header */}
        <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-[#111827] to-[#0c111d] p-6 sm:p-8">
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-indigo-400">
              <span className="bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded">
                API &amp; Webhook Schema Defense
              </span>
              <span>·</span>
              <span className="text-slate-400">Deterministic AST Validation</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Detect API payload drift before it breaks production.
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              Compare historical and incoming API or webhook payloads side-by-side. DriftShield automatically flags
              structural restructurings, field removals, and type shifts—including financial unit ambiguities like integer cents vs decimal currency—and synthesizes type-safe TypeScript compatibility adapters.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleSelectPreset(defaultPreset)}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg border border-slate-700 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
                <span>Load Sample Data</span>
              </button>

              <button
                onClick={handleDetectDrift}
                disabled={!hasValidPayloads}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-500/30 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Detect Drift</span>
              </button>
            </div>
          </div>
        </section>

        {/* Current Active Preset Notes & Stale Banner */}
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0f172a] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="font-semibold text-white">Active Scenario:</span>
              <span className="text-indigo-400 font-medium">{currentPreset.name}</span>
              <span className="text-slate-500 hidden sm:inline">|</span>
              <span className="text-slate-400">{currentPreset.highlightNotes}</span>
            </div>
          </div>

          {isStale && (
            <div className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-950/20 text-xs text-amber-200 flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Payload editor text was modified. Analysis and verification suite are currently reflecting prior input.
                </span>
              </div>
              <button
                onClick={handleDetectDrift}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded font-medium transition-colors shrink-0 cursor-pointer"
              >
                Detect Drift
              </button>
            </div>
          )}
        </div>

        {/* Dual JSON Editors Section */}
        <section id="editors-section" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Dual Payload Workstation</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Paste or modify old and new schemas. Both editors perform live JSON syntax validation.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Old Payload Editor */}
            <JsonEditor
              title="Old API Payload"
              badgeText="Legacy Contract"
              badgeVariant="blue"
              subtitle="Expected format consumed by existing frontend & backend services"
              value={oldJsonText}
              onChange={handleOldJsonChange}
              error={oldSyntaxError}
            />

            {/* New Payload Editor */}
            <JsonEditor
              title="New API Payload"
              badgeText="Incoming Drift"
              badgeVariant="purple"
              subtitle="Updated webhook or API schema to test against legacy requirements"
              value={newJsonText}
              onChange={handleNewJsonChange}
              error={newSyntaxError}
            />
          </div>
        </section>

        {/* Section 2: Drift Analysis Report */}
        {isAnalyzed && driftSummary ? (
          <DriftReport
            items={driftItems}
            summary={driftSummary}
            isStale={isStale}
            onRerunDrift={handleDetectDrift}
            onJumpToAdapter={() => {
              const el = document.getElementById('adapter-studio');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
          />
        ) : (
          <section id="drift-report" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Drift Analysis &amp; Impact Matrix</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Deterministic AST evaluation of schema alterations, structural restructurings, and type mutations.
                </p>
              </div>
            </div>
            <div className="p-8 rounded-xl border border-slate-800 bg-[#111827] text-center space-y-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white">Analysis Awaiting Trigger</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Configure legacy and incoming schemas in the workstation above, then click <strong>Detect Drift</strong> to evaluate structural shifts, removed keys, and type mutations.
              </p>
              <button
                onClick={handleDetectDrift}
                disabled={!hasValidPayloads}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Detect Drift</span>
              </button>
            </div>
          </section>
        )}

        {/* Section 3: Adapter Studio Section */}
        {isAnalyzed ? (
          <AdapterStudio
            adapterCode={adapterCode}
            config={adapterConfig}
            onConfigChange={setAdapterConfig}
            hasAmbiguousAmount={driftSummary?.hasAmbiguousUnits ?? false}
          />
        ) : (
          <section id="adapter-studio" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">TypeScript Compatibility Adapter</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Production-ready transformation function normalizing newly formatted payloads into legacy application contracts.
                </p>
              </div>
            </div>
            <div className="p-8 rounded-xl border border-slate-800 bg-[#111827] text-center space-y-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                <Code2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white">Adapter Studio Standby</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Run drift detection above to synthesize a drop-in TypeScript adapter with strict interfaces, runtime assertions, and customizable conversion rules.
              </p>
            </div>
          </section>
        )}

        {/* Section 4: Test Panel Section */}
        {isAnalyzed ? (
          <TestPanel
            results={testResults}
            onRunTests={handleRunTests}
            isRunning={isRunningTests}
          />
        ) : (
          <section id="test-panel" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Dual-Payload Verification Suite</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Executes the synthesized adapter against both old and new payloads with genuine runtime assertions and visual diffs.
                </p>
              </div>
            </div>
            <div className="p-8 rounded-xl border border-slate-800 bg-[#111827] text-center space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white">Verification Sandbox Standby</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Run drift detection to compile the compatibility adapter and execute the dual-payload verification test suite in this sandbox.
              </p>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#0b0f19] py-8 text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">DriftShield AI</span>
            <span>·</span>
            <span>Payload Drift &amp; Compatibility Engine</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Client-side deterministic AST verification</span>
            <span>·</span>
            <span>MIT License</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
