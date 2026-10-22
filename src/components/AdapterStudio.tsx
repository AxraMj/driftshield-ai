import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  Code2,
  Copy,
  Download,
  Settings2,
  ShieldCheck,
} from 'lucide-react';
import { AdapterConfig, AmountConversionRule } from '../types/drift';

interface AdapterStudioProps {
  adapterCode: string;
  config: AdapterConfig;
  onConfigChange: (newConfig: AdapterConfig) => void;
  hasAmbiguousAmount: boolean;
}

export const AdapterStudio: React.FC<AdapterStudioProps> = ({
  adapterCode,
  config,
  onConfigChange,
  hasAmbiguousAmount,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(adapterCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleDownload = () => {
    const blob = new Blob([adapterCode], { type: 'text/typescript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payload-compatibility-adapter.ts';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAmountRuleChange = (rule: AmountConversionRule) => {
    onConfigChange({
      ...config,
      amountRule: rule,
    });
  };

  const handleToggleAssertions = () => {
    onConfigChange({
      ...config,
      includeRuntimeAssertions: !config.includeRuntimeAssertions,
    });
  };

  return (
    <section id="adapter-studio" className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              TypeScript Compatibility Adapter
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-indigo-500/30 bg-indigo-500/10 text-indigo-300">
              Auto-Synthesized
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Production-ready transformation function normalizing newly formatted payloads into legacy application contracts.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg border border-slate-700 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Code'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .ts</span>
          </button>
        </div>
      </div>

      {/* Prominent Developer Review Disclaimer Notice */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
            ⚠️ Suggested Adapter Notice
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            This TypeScript adapter is an algorithmic suggestion synthesized based on structural and schema heuristics.
            Because downstream business logic may rely on domain invariants, always perform a thorough developer code review
            and verify unit conversion formulas before shipping to production.
          </p>
        </div>
      </div>

      {/* Interactive Conversion Rule Studio Controls */}
      <div className="p-5 rounded-xl border border-slate-800 bg-[#111827] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Conversion &amp; Validation Rules</h3>
          </div>
          <span className="text-xs text-slate-400">Customizes synthesized adapter logic</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
          {/* Amount / Monetary Rule Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200">
                Amount / Monetary Unit Rule:
              </label>
              {hasAmbiguousAmount && (
                <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Requires explicit intent
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-850 hover:bg-slate-800/60 border border-slate-800 cursor-pointer transition-colors text-xs">
                <input
                  type="radio"
                  name="amountRule"
                  value="CENTS_TO_DOLLARS"
                  checked={config.amountRule === 'CENTS_TO_DOLLARS'}
                  onChange={() => handleAmountRuleChange('CENTS_TO_DOLLARS')}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-medium text-slate-200 block">
                    Dollar String to Integer Cents (× 100)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Converts <code className="font-mono text-indigo-300">"25.00"</code> into <code className="font-mono text-indigo-300">2500</code> (Matches standard Stripe / payment processor legacy format).
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-850 hover:bg-slate-800/60 border border-slate-800 cursor-pointer transition-colors text-xs">
                <input
                  type="radio"
                  name="amountRule"
                  value="PARSE_FLOAT"
                  checked={config.amountRule === 'PARSE_FLOAT'}
                  onChange={() => handleAmountRuleChange('PARSE_FLOAT')}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-medium text-slate-200 block">
                    Parse String to Numeric Float
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Parses <code className="font-mono text-indigo-300">"25.00"</code> into <code className="font-mono text-indigo-300">25.00</code> (number).
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-850 hover:bg-slate-800/60 border border-slate-800 cursor-pointer transition-colors text-xs">
                <input
                  type="radio"
                  name="amountRule"
                  value="KEEP_AS_STRING"
                  checked={config.amountRule === 'KEEP_AS_STRING'}
                  onChange={() => handleAmountRuleChange('KEEP_AS_STRING')}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-medium text-slate-200 block">
                    Keep as Formatted String
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Preserves <code className="font-mono text-indigo-300">"25.00"</code> as string for UI rendering.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Runtime Defensive Assertion Settings */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-200 block">
              Runtime Contract Verification:
            </label>

            <div className="p-3 rounded-lg bg-slate-850 border border-slate-800 space-y-3">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={config.includeRuntimeAssertions}
                  onChange={handleToggleAssertions}
                  className="mt-0.5 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <div>
                  <span className="font-medium text-slate-200 block">
                    Inject Runtime Invariant Assertions
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Throws a descriptive <code className="font-mono text-indigo-300">PayloadCompatibilityError</code> immediately if any required legacy field is missing from adapted output.
                  </span>
                </div>
              </label>

              <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                <p>
                  <strong>Defensive Lookups:</strong> Uses safe chained lookups (<code className="font-mono text-slate-300">newObj?.customer?.id ?? newObj?.customer_id</code>) so the adapter safely processes both legacy and modern payloads.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Code Viewer */}
      <div className="rounded-xl border border-slate-800 bg-[#0d131f] overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#090d16] border-b border-slate-800 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-indigo-400" />
            <span className="text-slate-300">payload-compatibility-adapter.ts</span>
          </div>
          <span className="text-[11px] text-slate-500">TypeScript 5.x</span>
        </div>

        <pre className="p-4 overflow-x-auto text-xs font-mono leading-relaxed text-slate-200 bg-[#090d16] max-h-[480px]">
          <code>{adapterCode}</code>
        </pre>
      </div>
    </section>
  );
};
