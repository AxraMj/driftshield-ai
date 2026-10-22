import React from 'react';
import { ShieldCheck, Play, Sparkles } from 'lucide-react';
import { SamplePreset } from '../types/drift';
import { SAMPLE_PRESETS } from '../data/samplePresets';

interface NavbarProps {
  onDetectDrift: () => void;
  onSelectPreset: (preset: SamplePreset) => void;
  selectedPresetId: string;
  hasValidPayloads: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onDetectDrift,
  onSelectPreset,
  selectedPresetId,
  hasValidPayloads,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0b0f19]/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <a href="#" className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
              DriftShield <span className="text-indigo-400 font-medium text-sm">AI</span>
            </a>
          </div>

          {/* Zone 2: Clean single-line navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <a href="#editors-section" className="hover:text-white transition-colors whitespace-nowrap">
              Payload Editors
            </a>
            <a href="#drift-report" className="hover:text-white transition-colors whitespace-nowrap">
              Drift Analysis
            </a>
            <a href="#adapter-studio" className="hover:text-white transition-colors whitespace-nowrap">
              TypeScript Adapter
            </a>
            <a href="#test-panel" className="hover:text-white transition-colors whitespace-nowrap">
              Verification Suite
            </a>
          </nav>

          {/* Zone 3: Primary action button */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onDetectDrift}
              disabled={!hasValidPayloads}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white rounded-lg transition-all shadow-sm ${
                hasValidPayloads
                  ? 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-indigo-500/20 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
              } whitespace-nowrap`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Detect Drift</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-toolbar: Preset bar with single-row horizontal scrolling on tablet & mobile */}
      <div className="bg-[#0f172a] border-t border-slate-800/80 px-4 sm:px-6 lg:px-8 py-2 overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400 min-w-0 flex-1">
            <div className="flex items-center gap-1.5 shrink-0 text-slate-300 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="whitespace-nowrap">Sample Scenarios:</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar min-w-0 flex-1">
              {SAMPLE_PRESETS.map(preset => {
                const isSelected = preset.id === selectedPresetId;
                return (
                  <button
                    key={preset.id}
                    onClick={() => onSelectPreset(preset)}
                    className={`px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap cursor-pointer shrink-0 ${
                      isSelected
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-medium'
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/60'
                    }`}
                  >
                    {preset.name}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="text-slate-400 hidden xl:flex items-center gap-2 shrink-0">
            <span>Deterministic AST diffing</span>
            <span aria-hidden="true">·</span>
            <span>Zero paid API key required</span>
            <span aria-hidden="true">·</span>
            <span>TypeScript strict typing</span>
          </div>
        </div>
      </div>
    </header>
  );
};
