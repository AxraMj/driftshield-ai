import React, { useState } from 'react';
import { AlertCircle, Check, Copy, Trash2, Wand2 } from 'lucide-react';

interface JsonEditorProps {
  title: string;
  badgeText: string;
  badgeVariant?: 'blue' | 'purple';
  subtitle: string;
  value: string;
  onChange: (val: string) => void;
  error: string | null;
}

export const JsonEditor: React.FC<JsonEditorProps> = ({
  title,
  badgeText,
  badgeVariant = 'blue',
  subtitle,
  value,
  onChange,
  error,
}) => {
  const [copied, setCopied] = useState(false);

  const lineCount = value.split('\n').length;
  const charCount = value.length;

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(value);
      onChange(JSON.stringify(parsed, null, 2));
    } catch {
      // Do nothing if invalid JSON
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  const handleClear = () => {
    onChange('{\n  \n}');
  };

  // Generate line numbers for the gutter
  const lineNumbers = Array.from({ length: Math.max(lineCount, 8) }, (_, i) => i + 1);

  return (
    <div className="flex flex-col rounded-xl border border-slate-800 bg-[#111827] overflow-hidden shadow-lg shadow-black/20">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0d131f] border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white tracking-tight">{title}</h3>
            <span
              className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                badgeVariant === 'blue'
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
              }`}
            >
              {badgeText}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleFormat}
            title="Format / Prettify JSON"
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded border border-slate-700/60 transition-colors cursor-pointer"
          >
            <Wand2 className="w-3 h-3 text-indigo-400" />
            <span>Format</span>
          </button>

          <button
            onClick={handleCopy}
            title="Copy to clipboard"
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded border border-slate-700/60 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleClear}
            title="Clear editor"
            className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-800/80 hover:bg-slate-700/80 rounded border border-slate-700/60 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Syntax Error Alert */}
      {error && (
        <div className="flex items-start gap-2.5 px-4 py-2 bg-rose-950/40 border-b border-rose-900/60 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 font-mono">
            <span className="font-semibold text-rose-200">Syntax Error: </span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Editor Body with Gutter */}
      <div className="relative flex flex-1 min-h-[300px] max-h-[460px] overflow-auto bg-[#090d16]">
        {/* Line Numbers Gutter */}
        <div
          aria-hidden="true"
          className="select-none py-3 px-3 text-right bg-[#0b0f19] border-r border-slate-800/60 text-slate-600 font-mono text-xs leading-6 min-w-[42px]"
        >
          {lineNumbers.map(n => (
            <div key={n}>{n}</div>
          ))}
        </div>

        {/* Textarea Input */}
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          spellCheck={false}
          className="flex-1 w-full p-3 font-mono text-xs leading-6 text-slate-200 bg-transparent resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
          placeholder="Paste JSON payload here..."
        />
      </div>

      {/* Editor Footer Status */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#0d131f] border-t border-slate-800 text-[11px] text-slate-400 font-mono">
        <div className="flex items-center gap-3">
          <span>Lines: <strong className="text-slate-300 tabular-nums">{lineCount}</strong></span>
          <span aria-hidden="true">·</span>
          <span>Chars: <strong className="text-slate-300 tabular-nums">{charCount}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${error ? 'bg-rose-500' : 'bg-emerald-500'}`} />
          <span className="text-[10px] text-slate-400">{error ? 'Invalid JSON' : 'Valid JSON'}</span>
        </div>
      </div>
    </div>
  );
};
