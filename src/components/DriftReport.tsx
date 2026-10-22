import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileCode,
  Info,
  RotateCcw,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { DriftItem, DriftSummary } from '../types/drift';

interface DriftReportProps {
  items: DriftItem[];
  summary: DriftSummary;
  onJumpToAdapter: () => void;
  isStale?: boolean;
  onRerunDrift?: () => void;
}

export const DriftReport: React.FC<DriftReportProps> = ({
  items,
  summary,
  onJumpToAdapter,
  isStale,
  onRerunDrift,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'BREAKING' | 'WARNING' | 'SAFE'>('ALL');

  const filteredItems = items.filter(item => {
    if (filter === 'ALL') return true;
    if (filter === 'BREAKING') return item.severity === 'BREAKING';
    if (filter === 'WARNING') return item.severity === 'WARNING';
    if (filter === 'SAFE') return item.severity === 'SAFE';
    return true;
  });

  return (
    <section id="drift-report" className="space-y-6">
      {/* Stale Analysis Alert */}
      {isStale && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/50 text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-lg">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Payloads Modified:</strong> The payload editor contents have changed since this analysis was run. Re-run drift detection to update your report, adapter, and test results.
            </span>
          </div>
          {onRerunDrift && (
            <button
              onClick={onRerunDrift}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg shrink-0 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Rerun Detect Drift</span>
            </button>
          )}
        </div>
      )}

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Drift Analysis &amp; Impact Matrix</h2>
          <p className="text-sm text-slate-400 mt-1">
            Deterministic AST evaluation of schema alterations, structural restructurings, and type mutations.
          </p>
        </div>

        <button
          onClick={onJumpToAdapter}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
        >
          <FileCode className="w-4 h-4" />
          <span>View TypeScript Adapter</span>
        </button>
      </div>

      {/* Impact Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Changes */}
        <div className="p-4 rounded-xl border border-slate-800 bg-[#111827] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Drift Detected</span>
            <Zap className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-white tabular-nums">
              {summary.totalChanges}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Schema paths analyzed</p>
          </div>
        </div>

        {/* Breaking Changes */}
        <div className={`p-4 rounded-xl border ${summary.breakingCount > 0 ? 'border-rose-800/60 bg-rose-950/20' : 'border-slate-800 bg-[#111827]'} flex flex-col justify-between`}>
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-xs font-medium">Breaking Changes</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-rose-200 tabular-nums">
              {summary.breakingCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Removed keys &amp; type clashes</p>
          </div>
        </div>

        {/* Ambiguous Unit Shifts */}
        <div className={`p-4 rounded-xl border ${summary.warningCount > 0 || summary.hasAmbiguousUnits ? 'border-amber-800/60 bg-amber-950/20' : 'border-slate-800 bg-[#111827]'} flex flex-col justify-between`}>
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-medium">Warnings &amp; Ambiguities</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-amber-200 tabular-nums">
              {summary.warningCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {summary.hasAmbiguousUnits ? 'Unit conversion rule required' : 'Nullable or format warnings'}
            </p>
          </div>
        </div>

        {/* Safe Additions */}
        <div className="p-4 rounded-xl border border-slate-800 bg-[#111827] flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-medium">Safe Additions</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-emerald-200 tabular-nums">
              {summary.safeCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Non-breaking optional fields</p>
          </div>
        </div>
      </div>

      {/* Mandated Unit Ambiguity Flag / Callout */}
      {summary.hasAmbiguousUnits && (
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-600/40 text-amber-200 text-xs flex flex-col sm:flex-row items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-100 text-sm">
              Critical Unit Ambiguity Flag: Manual Developer Conversion Rule Required
            </p>
            <p className="text-amber-300 leading-relaxed">
              DriftShield detected a type mutation on a monetary or unit-sensitive field (such as <code className="bg-amber-900/60 px-1 py-0.5 rounded font-mono text-amber-100">amount</code>).
              Do <strong>not</strong> assume equivalent units: integer values may represent cents, while formatted strings often represent decimal currency units.
              An explicit conversion rule has been configured in the adapter settings below.
            </p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
            filter === 'ALL'
              ? 'bg-slate-800 text-white'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          All Drift ({items.length})
        </button>
        <button
          onClick={() => setFilter('BREAKING')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
            filter === 'BREAKING'
              ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
              : 'text-slate-400 hover:text-rose-300 hover:bg-slate-800/40'
          }`}
        >
          Breaking ({summary.breakingCount})
        </button>
        <button
          onClick={() => setFilter('WARNING')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
            filter === 'WARNING'
              ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
              : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800/40'
          }`}
        >
          Warnings ({summary.warningCount})
        </button>
        <button
          onClick={() => setFilter('SAFE')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
            filter === 'SAFE'
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
              : 'text-slate-400 hover:text-emerald-300 hover:bg-slate-800/40'
          }`}
        >
          Safe Additions ({summary.safeCount})
        </button>
      </div>

      {/* Drift Items Table / List */}
      {filteredItems.length === 0 ? (
        <div className="p-8 text-center rounded-xl border border-slate-800 bg-[#111827]">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-white">No drift matching current filter</h4>
          <p className="text-xs text-slate-400 mt-1">Select another filter tab or review the complete analysis.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-[#111827] overflow-hidden">
          <div className="divide-y divide-slate-800/80">
            {filteredItems.map(item => {
              const isBreaking = item.severity === 'BREAKING';
              const isWarning = item.severity === 'WARNING';

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 hover:bg-slate-800/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    {/* Path & Badge Row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-white bg-slate-800 px-2.5 py-1 rounded border border-slate-700">
                        {item.path}
                      </span>

                      {/* Type Badge */}
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                          item.type === 'RESTUCTURED_RENAME'
                            ? 'bg-purple-950/50 text-purple-300 border-purple-800/60'
                            : item.type === 'TYPE_CHANGED'
                            ? 'bg-amber-950/50 text-amber-300 border-amber-800/60'
                            : item.type === 'REMOVED'
                            ? 'bg-rose-950/50 text-rose-300 border-rose-800/60'
                            : 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60'
                        }`}
                      >
                        {item.type.replace('_', ' ')}
                      </span>

                      {/* Severity Label */}
                      <span
                        className={`text-xs font-medium flex items-center gap-1 ${
                          isBreaking
                            ? 'text-rose-400'
                            : isWarning
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {isBreaking ? '● Breaking' : isWarning ? '▲ Review Rule' : '✓ Additive'}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Ambiguity Callout if any */}
                    {item.ambiguityDescription && (
                      <div className="flex items-start gap-1.5 text-[11px] text-amber-300 bg-amber-950/30 p-2 rounded border border-amber-800/40">
                        <Info className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5" />
                        <span>{item.ambiguityDescription}</span>
                      </div>
                    )}
                  </div>

                  {/* Values comparison block */}
                  <div className="flex items-center gap-3 bg-[#0d131f] p-3 rounded-lg border border-slate-800 min-w-[280px]">
                    <div className="flex-1">
                      <div className="text-[10px] uppercase font-mono text-slate-500">Old Value</div>
                      <div className="font-mono text-xs text-rose-300 truncate mt-0.5">
                        {item.oldValue !== undefined ? JSON.stringify(item.oldValue) : '<none>'}
                        {item.oldType && <span className="text-[10px] text-slate-500 ml-1">({item.oldType})</span>}
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />

                    <div className="flex-1">
                      <div className="text-[10px] uppercase font-mono text-slate-500">New Value</div>
                      <div className="font-mono text-xs text-emerald-300 truncate mt-0.5">
                        {item.newValue !== undefined ? JSON.stringify(item.newValue) : '<none>'}
                        {item.newType && <span className="text-[10px] text-slate-500 ml-1">({item.newType})</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
