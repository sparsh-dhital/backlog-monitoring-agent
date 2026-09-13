import type { ReactNode } from "react";

const toneConfig = {
  neutral: {
    badge:
      "bg-slate-500/10 text-slate-700 border border-slate-500/20 backdrop-blur-md",
    stat: "border-white/40 bg-white/60 backdrop-blur-lg shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]",
    value: "text-slate-800",
    indicator: "bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.6)]",
  },
  success: {
    badge:
      "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 backdrop-blur-md",
    stat: "border-emerald-200/50 bg-emerald-50/40 backdrop-blur-lg shadow-[0_4px_20px_-4px_rgba(16,185,129,0.1)]",
    value:
      "bg-clip-text text-transparent bg-gradient-to-br from-emerald-600 to-teal-500",
    indicator: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]",
  },
  warning: {
    badge:
      "bg-amber-500/10 text-amber-700 border border-amber-500/20 backdrop-blur-md",
    stat: "border-amber-200/50 bg-amber-50/40 backdrop-blur-lg shadow-[0_4px_20px_-4px_rgba(245,158,11,0.1)]",
    value:
      "bg-clip-text text-transparent bg-gradient-to-br from-amber-600 to-orange-500",
    indicator: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]",
  },
  danger: {
    badge:
      "bg-rose-500/10 text-rose-700 border border-rose-500/20 backdrop-blur-md",
    stat: "border-rose-200/50 bg-rose-50/40 backdrop-blur-lg shadow-[0_4px_20px_-4px_rgba(244,63,94,0.1)]",
    value:
      "bg-clip-text text-transparent bg-gradient-to-br from-rose-600 to-red-500",
    indicator: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]",
  },
};

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const cfg = toneConfig[tone] ?? toneConfig.neutral;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${cfg.badge}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.indicator}`}
      />
      {children}
    </span>
  );
}

export function StatCard({
  label,
  value,
  detail,
  tone = "neutral",
  icon,
}: {
  label: string;
  value: string | number;
  detail: string;
  tone?: string;
  icon?: ReactNode;
}) {
  const cfg = toneConfig[tone as keyof typeof toneConfig] ?? toneConfig.neutral;
  return (
    <div
      className={`dashboard-stat relative flex flex-col gap-1 p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 ${cfg.stat}`}
    >
      {icon && (
        <div className="absolute top-4 right-4 opacity-20 text-slate-400">
          {icon}
        </div>
      )}
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        {label}
      </span>
      <strong className={`text-2xl font-bold tracking-tight mt-1 ${cfg.value}`}>
        {value}
      </strong>
      <small className="text-[11px] font-medium text-slate-500 mt-0.5">
        {detail}
      </small>
    </div>
  );
}
