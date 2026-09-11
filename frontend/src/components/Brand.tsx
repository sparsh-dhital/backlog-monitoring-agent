import { ShieldCheck } from "lucide-react";

export default function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`product-brand ${compact ? "compact" : ""}`}>
      <span className="product-brand-mark" aria-hidden="true">
        <ShieldCheck size={compact ? 16 : 18} strokeWidth={2.4} />
      </span>
      {!compact && <span>EduRecover</span>}
    </span>
  );
}
