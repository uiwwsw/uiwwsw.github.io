import { ReactNode } from 'react';

export function CodeSnippet({ label, code }: { label?: ReactNode; code: string }) {
  return (
    <div className="rounded-2xl border border-slate-800/70 bg-slate-950/80 text-left shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
        <span>{label ?? 'Code'}</span>
        <span className="rounded-full bg-slate-800 px-2 py-1 text-[11px] text-slate-200">snippet</span>
      </div>
      <pre className="overflow-auto whitespace-pre-wrap break-words px-4 py-3 text-sm text-slate-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}
