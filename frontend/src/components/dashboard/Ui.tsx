import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import type { CourseStatus } from "../../data/dashboard";

const statusStyles: Record<CourseStatus, string> = {
  "On track":
    "bg-secondary-50 text-secondary-700 dark:bg-secondary-900/40 dark:text-secondary-300",
  "Needs attention":
    "bg-warning/10 text-warning dark:bg-warning/15 dark:text-warning",
  "At risk": "bg-danger/10 text-danger dark:bg-danger/15 dark:text-danger",
  Completed:
    "bg-gray-100 text-gray-600 dark:bg-dark-elevated dark:text-gray-300",
};

export function StatusChip({ status }: { status: CourseStatus | string }) {
  const tone =
    statusStyles[status as CourseStatus] ??
    "bg-gray-100 text-gray-600 dark:bg-dark-elevated dark:text-gray-300";

  return (
    <span
      className={`inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium ${tone}`}
    >
      {status}
    </span>
  );
}

export function IconButton({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="relative inline-flex size-10 items-center justify-center rounded-xl border border-gray-200 bg-surface-card text-gray-600 transition-colors duration-standard hover:border-primary-200 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 dark:border-dark-border dark:bg-dark-elevated dark:text-gray-400 dark:hover:text-primary-300"
    >
      {children}
    </button>
  );
}

type SurfaceCardProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export function SurfaceCard<T extends ElementType = "article">({
  children,
  className = "",
  as,
  ...rest
}: SurfaceCardProps<T>) {
  const Tag = (as ?? "article") as ElementType;
  return (
    <Tag
      className={`rounded-2xl border border-gray-200 bg-surface-card p-5 shadow-card transition-all duration-standard hover:-translate-y-0.5 dark:border-dark-border dark:bg-dark-card dark:shadow-none ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}
