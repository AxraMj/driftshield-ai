import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Play,
  RotateCcw,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { TestCaseResult } from '../types/drift';

interface TestPanelProps {
  results: TestCaseResult[] | null;
  onRunTests: () => void;
  isRunning: boolean;
}

export const TestPanel: React.FC<TestPanelProps> = ({
  results,
  onRunTests,
  isRunning,
}) => {
  const [activeTestId, setActiveTestId] = useState<string | null>(null);

  const passedCount = results ? results.filter(r => r.passed).length : 0;
  const failedCount = results ? results.filter(r => !r.passed).length : 0;
  const totalDuration = results
    ? results.reduce((acc, r) => acc + r.durationMs, 0).toFixed(2)
    : '0.00';

  const selectedTest = results
    ? results.find(r => r.id === activeTestId) || results[0]
    : null;

  return (
    <section id="test-panel" className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Dual-Payload Verification Suite
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
              Live In-Browser Sandbox
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Executes the synthesized adapter against both old and new payloads with genuine runtime assertions and visual diffs.
          </p>
        </div>

        {/* Run Test Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRunTests}
            disabled={isRunning}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white rounded-lg transition-all shadow-md ${
              isRunning
                ? 'bg-slate-700 cursor-wait'
                : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-emerald-500/20 cursor-pointer'
            }`}
          >
            {isRunning ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                <span>Executing Sandbox Suite...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Compatibility Suite</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Overview Metrics */}
      {results && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-[#111827] flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-400">Tests Passed</div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1 tabular-nums">
                {passedCount} / {results.length}
              </div>
            </div>
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-[#111827] flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-400">Tests Failed</div>
              <div className={`text-2xl font-bold font-mono mt-1 tabular-nums ${failedCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                {failedCount}
              </div>
            </div>
            {failedCount > 0 ? (
              <XCircle className="w-6 h-6 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-slate-600" />
            )}
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-[#111827] flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-400">Execution Latency</div>
              <div className="text-2xl font-bold font-mono text-indigo-300 mt-1 tabular-nums">
                {totalDuration} <span className="text-sm font-normal text-slate-400">ms</span>
              </div>
            </div>
            <Clock className="w-6 h-6 text-indigo-400" />
          </div>
        </div>
      )}

      {/* Test Execution Body */}
      {!results ? (
        <div className="p-10 rounded-xl border border-slate-800 bg-[#111827] text-center space-y-3">
          <Sparkles className="w-8 h-8 text-indigo-400 mx-auto" />
          <h3 className="text-base font-semibold text-white">Verification Suite Ready</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Click <strong>Run Compatibility Suite</strong> above to execute the generated adapter function against both payload models and inspect field-by-field assertions.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Test Cases List Column */}
          <div className="lg:col-span-5 space-y-3">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
              Test Cases ({results.length})
            </h4>

            <div className="space-y-2">
              {results.map(test => {
                const isSelected = selectedTest?.id === test.id;
                return (
                  <button
                    key={test.id}
                    onClick={() => setActiveTestId(test.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-500/60 bg-indigo-950/20 shadow-md'
                        : 'border-slate-800 bg-[#111827] hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {test.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <span className="text-xs font-semibold text-white truncate">
                          {test.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                        {test.durationMs}ms
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      {test.description}
                    </p>

                    <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-slate-500">
                      <span>Target: {test.targetPayload}</span>
                      <span>·</span>
                      <span className={test.passed ? 'text-emerald-400' : 'text-rose-400'}>
                        {test.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Visual Diff & Inspection Column */}
          <div className="lg:col-span-7">
            {selectedTest && (
              <div className="rounded-xl border border-slate-800 bg-[#111827] overflow-hidden">
                {/* Diff Header */}
                <div className="px-5 py-3.5 bg-[#0d131f] border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white">{selectedTest.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{selectedTest.description}</p>
                  </div>
                  <span
                    className={`text-xs font-mono px-2.5 py-1 rounded border font-semibold ${
                      selectedTest.passed
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
                        : 'bg-rose-950/60 text-rose-300 border-rose-800/80'
                    }`}
                  >
                    {selectedTest.passed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>

                {/* Error Banner if any */}
                {selectedTest.errorMessage && (
                  <div className="p-3 bg-rose-950/40 border-b border-rose-900/60 text-xs text-rose-300 font-mono flex items-start gap-2">
                    <Flame className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>Error: {selectedTest.errorMessage}</span>
                  </div>
                )}

                {/* Field-by-field Assertions Diff */}
                <div className="p-5 space-y-4">
                  <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                    Visual Field Comparison (Expected vs Adapted)
                  </h5>

                  {selectedTest.fieldMismatches && selectedTest.fieldMismatches.length > 0 ? (
                    <div className="rounded-lg border border-slate-800 bg-[#090d16] divide-y divide-slate-800/80 overflow-hidden text-xs font-mono">
                      <div className="grid grid-cols-12 px-3 py-2 bg-slate-900/80 text-[11px] text-slate-400 font-semibold uppercase">
                        <div className="col-span-4">Field</div>
                        <div className="col-span-3">Expected (Legacy)</div>
                        <div className="col-span-3">Adapted (Received)</div>
                        <div className="col-span-2 text-right">Status</div>
                      </div>

                      {selectedTest.fieldMismatches.map(item => (
                        <div
                          key={item.field}
                          className={`grid grid-cols-12 px-3 py-2.5 items-center transition-colors ${
                            item.matches ? 'hover:bg-slate-800/20' : 'bg-rose-950/20 hover:bg-rose-950/30'
                          }`}
                        >
                          <div className="col-span-4 font-semibold text-slate-200 truncate">
                            {item.field}
                          </div>

                          <div className="col-span-3 text-slate-300 truncate">
                            {JSON.stringify(item.expected)}
                          </div>

                          <div className={`col-span-3 truncate ${item.matches ? 'text-emerald-300 font-medium' : 'text-rose-300 font-bold'}`}>
                            {JSON.stringify(item.received)}
                          </div>

                          <div className="col-span-2 text-right">
                            {item.matches ? (
                              <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                                ✓ Match
                              </span>
                            ) : (
                              <span className="text-[10px] text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/60">
                                ✗ Diff
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      No discrete scalar field assertions for this test case.
                    </p>
                  )}

                  {/* Raw Output Inspector */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-1.5">
                      <span>Adapted Output JSON:</span>
                      <span className="text-[10px] text-slate-500">Live Result</span>
                    </div>
                    <pre className="p-3 bg-[#090d16] border border-slate-800 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto max-h-[180px]">
                      <code>
                        {selectedTest.output !== undefined
                          ? JSON.stringify(selectedTest.output, null, 2)
                          : '<null>'}
                      </code>
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
