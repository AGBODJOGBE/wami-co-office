"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

// ─── Boutons ────────────────────────────────────────────────────────────────

type ButtonTone = "default" | "primary" | "danger" | "ghost";

export function Button({
  tone = "default",
  size = "md",
  busy = false,
  className,
  children,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: ButtonTone; size?: "sm" | "md"; busy?: boolean }) {
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[10px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45",
        size === "sm" ? "h-8 px-2.5 text-xs" : "h-9 px-3.5 text-[13px]",
        tone === "default" && "border-[1.5px] border-ink bg-white text-ink hover:bg-field",
        tone === "primary" && "border-[1.5px] border-brand bg-brand text-white hover:bg-brand-strong",
        tone === "danger" && "border-[1.5px] border-bad bg-white text-bad hover:bg-bad-soft",
        tone === "ghost" && "text-muted hover:bg-field hover:text-ink",
        className,
      )}
    >
      {busy ? "…" : children}
    </button>
  );
}

// ─── Conteneurs ─────────────────────────────────────────────────────────────

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn("min-w-0 rounded-[14px] border border-line bg-white", className)}>{children}</section>;
}

export function CardHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-3.5 pb-2">
      <h2 className="text-sm font-bold">{title}</h2>
      {children}
    </div>
  );
}

export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <h1 className="font-display text-[22px] font-bold tracking-tight">{title}</h1>
      {children}
    </div>
  );
}

export function Kpi({ label, value, hint }: { label: string; value: string; hint?: ReactNode }) {
  return (
    <Card className="flex flex-col gap-1 px-4 py-3.5">
      <span className="text-xs text-muted">{label}</span>
      <span className="tabular font-display text-xl font-bold tracking-tight">{value}</span>
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </Card>
  );
}

export function KpiGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">{children}</div>;
}

/** Remarque « à valider » ou explication, en pointillés. */
export function Note({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("rounded-[10px] border border-dashed border-[#C9CCD3] bg-canvas px-2.5 py-2 text-[11.5px] leading-4 text-muted", className)}>
      {children}
    </p>
  );
}

export function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 text-[12.5px]">
      <span className="text-muted">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}

// ─── Étiquettes ─────────────────────────────────────────────────────────────

export type Tone = "ok" | "warn" | "bad" | "info" | "neutral";

export function Tag({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[10.5px] font-bold",
        tone === "ok" && "bg-ok-soft text-ok",
        tone === "warn" && "bg-warn-soft text-warn",
        tone === "bad" && "bg-bad-soft text-bad",
        tone === "info" && "bg-info-soft text-info",
        tone === "neutral" && "bg-field text-[#3E4558]",
      )}
    >
      {children}
    </span>
  );
}

// ─── Sélecteurs ─────────────────────────────────────────────────────────────

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: ReadonlyArray<readonly [T, string]>;
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex flex-wrap gap-[3px] rounded-[10px] bg-field p-[3px]">
      {options.map(([v, text]) => (
        <button
          key={v}
          type="button"
          aria-pressed={v === value}
          onClick={() => onChange(v)}
          className={cn(
            "h-7 rounded-lg px-3 text-xs font-semibold",
            v === value ? "bg-white text-ink shadow-[0_1px_2px_rgba(20,33,61,.12)]" : "text-muted hover:text-ink",
          )}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

export function Chip({ on, onClick, children }: { on?: boolean; onClick?: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn("h-[30px] whitespace-nowrap rounded-full px-3 text-xs font-semibold", on ? "bg-night text-white" : "bg-field text-ink hover:bg-line")}
    >
      {children}
    </button>
  );
}

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn("relative h-6 w-10 shrink-0 rounded-full transition-colors disabled:opacity-45", checked ? "bg-brand" : "bg-[#C9CCD3]")}
    >
      <span className={cn("absolute top-[3px] size-[18px] rounded-full bg-white transition-all", checked ? "left-[19px]" : "left-[3px]")} />
    </button>
  );
}

// ─── Champs ─────────────────────────────────────────────────────────────────

export const fieldClass =
  "h-9 w-full min-w-0 rounded-[10px] border border-transparent bg-field px-3 text-[13px] text-ink outline-none placeholder:text-muted focus:border-ink focus:bg-white";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-[10.5px] font-bold uppercase tracking-wider text-muted">{label}</span>
      {children}
      {hint ? <span className="text-[11px] text-muted">{hint}</span> : null}
    </label>
  );
}

// ─── États ──────────────────────────────────────────────────────────────────

export function Loading({ label = "Chargement…" }: { label?: string }) {
  return (
    <div role="status" className="flex min-h-40 items-center justify-center text-sm text-muted">
      {label}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex min-h-40 flex-col items-center justify-center gap-3 text-sm">
      <span className="text-bad">{message}</span>
      {onRetry ? <Button onClick={onRetry}>Réessayer</Button> : null}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="flex min-h-32 items-center justify-center px-4 text-center text-sm text-muted">{children}</div>;
}
