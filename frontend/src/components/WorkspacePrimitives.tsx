import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import "../styles/dashboard-views.css";

const toneConfig = {
  neutral: {
    badge:
      "bg-slate-500/10 text-slate-700 border border-slate-500/20",
    value: "text-slate-800",
    indicator: "bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.6)]",
    icon: "bg-slate-100 text-slate-600",
  },
  success: {
    badge:
      "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20",
    value:
      "bg-clip-text text-transparent bg-gradient-to-br from-emerald-600 to-teal-500",
    indicator: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]",
    icon: "bg-emerald-100 text-emerald-700",
  },
  warning: {
    badge:
      "bg-amber-500/10 text-amber-700 border border-amber-500/20",
    value:
      "bg-clip-text text-transparent bg-gradient-to-br from-amber-600 to-orange-500",
    indicator: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]",
    icon: "bg-amber-100 text-amber-700",
  },
  danger: {
    badge:
      "bg-red-500/10 text-red-700 border border-red-500/25",
    value:
      "bg-clip-text text-transparent bg-gradient-to-br from-rose-600 to-red-500",
    indicator: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]",
    icon: "bg-rose-100 text-rose-700",
  },
};

export type Tone = keyof typeof toneConfig;

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: Tone;
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
  const key = (tone in toneConfig ? tone : "neutral") as Tone;
  const cfg = toneConfig[key];
  return (
    <div className={`dashboard-stat metric-card is-${key}`}>
      <span aria-hidden="true" className="metric-card-accent" />
      <div className="flex items-start justify-between gap-3">
        <span className="metric-card-label">{label}</span>
        {icon && (
          <span aria-hidden="true" className={`metric-card-icon ${cfg.icon}`}>
            {icon}
          </span>
        )}
      </div>
      <strong className={`metric-card-value ${cfg.value}`}>{value}</strong>
      <small className="metric-card-detail">{detail}</small>
    </div>
  );
}

/** Eyebrow, title, optional description and a right-aligned action. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  icon: Icon,
  as: Heading = "h2",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: LucideIcon;
  as?: "h1" | "h2";
}) {
  return (
    <div className="dash-heading">
      <div className="min-w-0">
        <p className="dash-eyebrow">
          {Icon && <Icon size={13} aria-hidden="true" />}
          {eyebrow}
        </p>
        <Heading className="dash-title">{title}</Heading>
        {description && <p className="dash-description">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** Initials tile: the last two digits of an ID, or a name's first letters. */
export function Avatar({
  label,
  tone = "brand",
  size = "md",
}: {
  label: string;
  tone?: "brand" | "danger" | "neutral";
  size?: "sm" | "md";
}) {
  const digits = label.replace(/\D/g, "");
  const initials = digits
    ? digits.slice(-2)
    : label
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word[0])
        .join("")
        .slice(0, 2);
  return (
    <span aria-hidden="true" className={`dash-avatar is-${tone} is-${size}`}>
      {initials.toUpperCase()}
    </span>
  );
}
