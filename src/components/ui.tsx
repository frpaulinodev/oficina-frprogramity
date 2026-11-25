import { ReactNode, useEffect, useState } from "react";
import { IconChevronDown, IconX } from "./Icons";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export function Button({ children, variant = "default", size = "md", className, ...p }: {
  children: ReactNode; variant?: "default" | "primary" | "ghost" | "danger" | "subtle"; size?: "sm" | "md";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const v = {
    default: "bg-gradient-to-b from-ink-700/80 to-ink-800 hover:from-ink-700 hover:to-ink-700 text-slate-100 ring-1 ring-line shadow-[0_6px_14px_-10px_rgba(0,0,0,.9)]",
    primary: "bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white ring-1 ring-blue-300/40 shadow-[0_0_0_1px_rgba(59,130,246,.15),0_10px_24px_-10px_rgba(37,99,235,.9)] active:translate-y-px",
    ghost: "hover:bg-ink-800 text-slate-300",
    subtle: "bg-emerald-400/10 hover:bg-emerald-400/20 text-emerald-300 ring-1 ring-emerald-400/25",
    danger: "bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 ring-1 ring-rose-400/25",
  }[variant];
  const s = size === "sm" ? "h-7 px-2.5 text-xs gap-1.5" : "h-9 px-3.5 text-sm gap-2";
  return (
    <button {...p} className={cx("inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap", v, s, className)}>
      {children}
    </button>
  );
}

export function Panel({ title, actions, children, className, bodyClass }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; bodyClass?: string }) {
  return (
    <section className={cx("rounded-xl glass-panel", className)}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 px-4 h-12 border-b border-line/80 bg-gradient-to-r from-white/[0.03] to-transparent rounded-t-xl">
          <h3 className="text-[13px] font-semibold tracking-wide text-slate-200">{title}</h3>
          <div className="flex items-center gap-2">{actions}</div>
        </header>
      )}
      <div className={cx("p-4", bodyClass)}>{children}</div>
    </section>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-slate-500 mt-1">{hint}</span>}
    </label>
  );
}

const inputCls = "w-full h-9 rounded-md bg-ink-950 ring-1 ring-line focus:ring-blue-500/70 focus:outline-none px-3 text-sm text-slate-100 placeholder:text-slate-500";

export function Input(p: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...p} className={cx(inputCls, p.className)} />;
}

export function Textarea(p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...p} className={cx(inputCls, "h-auto py-2 min-h-[72px]", p.className)} />;
}

export function Select({ options, placeholder, className, ...p }: { options: [string, string][]; placeholder?: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={cx("relative", className)}>
      <select {...p} className={cx(inputCls, "pr-8 appearance-none")}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <IconChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  );
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset whitespace-nowrap", className || "bg-slate-400/10 text-slate-300 ring-slate-400/20")}>{children}</span>;
}

export function ScoreBar({ score }: { score: number | null }) {
  const s = score ?? 0;
  const color = s >= 80 ? "bg-emerald-400" : s >= 60 ? "bg-sky-400" : s >= 40 ? "bg-amber-300" : "bg-slate-500";
  return (
    <div className="flex items-center gap-2 min-w-[86px]">
      <span className="tabular-nums text-[13px] font-semibold w-6 text-right text-slate-100">{score ?? "—"}</span>
      <div className="h-1.5 flex-1 rounded-full bg-ink-700 overflow-hidden"><div className={cx("h-full rounded-full", color)} style={{ width: `${s}%` }} /></div>
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <span className={cx("inline-block w-4 h-4 rounded-full border-2 border-slate-500 border-t-blue-400 animate-spin", className)} />;
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="py-10 text-center">
      <div className="text-sm font-medium text-slate-300">{title}</div>
      {children && <div className="mt-1.5 text-[13px] text-slate-500 max-w-md mx-auto">{children}</div>}
    </div>
  );
}

export function Drawer({ open, onClose, children, width = "max-w-3xl" }: { open: boolean; onClose: () => void; children: ReactNode; width?: string }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className={cx("relative h-full w-full bg-ink-925 ring-1 ring-line shadow-2xl overflow-y-auto", width)}>
        <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded hover:bg-ink-800 text-slate-400" aria-label="Cerrar"><IconX /></button>
        {children}
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-lg bg-ink-900 ring-1 ring-line shadow-2xl">
        <header className="flex items-center justify-between px-5 h-12 border-b border-line">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-ink-800 text-slate-400"><IconX /></button>
        </header>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

type ToastT = { id: number; text: string; kind: "ok" | "error" };
let pushToast: (t: Omit<ToastT, "id">) => void = () => {};
export const toast = {
  ok: (text: string) => pushToast({ text, kind: "ok" }),
  error: (text: string) => pushToast({ text, kind: "error" }),
};

export function Toaster() {
  const [items, setItems] = useState<ToastT[]>([]);
  useEffect(() => {
    pushToast = (t) => {
      const id = Date.now() + Math.random();
      setItems((x) => [...x, { ...t, id }]);
      setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), t.kind === "error" ? 7000 : 4000);
    };
  }, []);
  return (
    <div className="fixed bottom-4 right-4 z-[60] space-y-2 w-[360px]">
      {items.map((t) => (
        <div key={t.id} className={cx("rounded-md px-4 py-3 text-sm shadow-xl ring-1", t.kind === "ok" ? "bg-ink-800 ring-emerald-400/30 text-emerald-100" : "bg-rose-950/90 ring-rose-400/40 text-rose-100")}>{t.text}</div>
      ))}
    </div>
  );
}

export function Stat({ label, value, sub, accent, icon }: { label: string; value: ReactNode; sub?: ReactNode; accent?: boolean; icon?: ReactNode }) {
  return (
    <div className="px-4 py-3.5 min-w-0 relative group">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-slate-400 truncate">
        {icon && <span className={cx("w-6 h-6 rounded-md grid place-items-center ring-1", accent ? "bg-emerald-400/10 ring-emerald-400/25 text-emerald-300" : "bg-blue-500/10 ring-blue-400/25 text-blue-300")}>{icon}</span>}
        <span className="truncate">{label}</span>
      </div>
      <div className={cx("mt-1.5 text-[26px] font-bold tabular-nums tracking-tight", accent ? "glow-green" : "glow-text")}>{value}</div>
      {sub && <div className="text-[11px] text-slate-500 mt-0.5 truncate">{sub}</div>}
    </div>
  );
}

export function HBar({ rows, total, color = "bg-blue-500" }: { rows: { label: string; value: number; color?: string }[]; total?: number; color?: string }) {
  const max = total ?? Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 items-center text-[13px]">
          <div className="min-w-0">
            <div className="flex justify-between gap-2"><span className="truncate text-slate-300">{r.label}</span></div>
            <div className="h-2 mt-1 rounded-full bg-ink-800/80 ring-1 ring-inset ring-white/[0.03]"><div className={cx("h-full rounded-full shadow-[0_0_12px_-2px_currentColor] transition-[width] duration-700", r.color || color)} style={{ width: `${Math.max(2, (100 * r.value) / max)}%` }} /></div>
          </div>
          <span className="tabular-nums text-slate-200 font-medium">{r.value.toLocaleString("es")}</span>
        </div>
      ))}
    </div>
  );
}
