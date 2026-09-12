import type { ReactNode } from "react";

const toneConfig = {
  neutral: {
    badge: "bg-slate-100 text-slate-600 border border-slate-200",
    stat: "border-slate-200/60 bg-white",
    value: "text-slate-800",
    indicator: "bg-slate-300",
  },
  success: {
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    stat: "border-emerald-100 bg-white",
    value: "text-emerald-700",
    indicator: "bg-emerald-500",
  },
  warning: {
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
    stat: "border-amber-100 bg-white",
    value: "text-amber-700",
    indicator: "bg-amber-500",
  },
  danger: {
    badge: "bg-rose-50 text-rose-700 border border-rose-200",
    stat: "border-rose-100 bg-white",
    value: "text-rose-700",
    indicator: "bg-rose-500",
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
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.indicator}`} />
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
      className={`relative flex flex-col gap-1 p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 ${cfg.stat}`}
    >
      {icon && (
        <div className="absolute top-4 right-4 opacity-20 text-slate-400">
          {icon}
        </div>
      )}
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {label}
      </span>
      <strong className={`text-3xl font-extrabold tracking-tight leading-none mt-1 ${cfg.value}`}>
        {value}
      </strong>
      <small className="text-xs text-slate-400 font-medium mt-1">{detail}</small>
    </div>
  );
}
