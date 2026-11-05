"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ROLE_LABELS, type Module } from "@/shared/auth/permissions";
import { useSession } from "@/shared/auth/session.store";
import { NAVIGATION } from "@/shared/config/navigation";
import { cn } from "@/shared/lib/cn";
import { initials } from "@/shared/lib/format";
import { Button, ErrorState, Loading } from "./primitives";
import { useToast } from "./toast.store";

/** Coque du back-office : menu latéral filtré par rôle, barre de recherche, messages. */
export function AppShell({ children }: { children: ReactNode }) {
  const { user, loaded, load } = useSession();
  const router = useRouter();

  useEffect(() => {
    load();
  }, [load]);

  if (!loaded) return <Loading label="Ouverture de la session…" />;
  if (!user) return <ErrorState message="Session expirée. Reconnectez-vous." onRetry={() => router.replace("/login")} />;

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[236px_minmax(0,1fr)]">
      <Sidebar />
      <div className="flex min-w-0 flex-col">
        <Topbar />
        <main className="flex min-w-0 flex-col gap-3.5 px-4 pt-5 pb-8 md:px-6">{children}</main>
      </div>
      <Toaster />
    </div>
  );
}

function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, can, logout } = useSession();
  const [open, setOpen] = useState(false);
  const groups = NAVIGATION.map((g) => ({ ...g, items: g.items.filter((i) => can(i.module)) })).filter((g) => g.items.length > 0);

  return (
    <nav aria-label="Menu du back-office" className="border-b border-line bg-white md:sticky md:top-0 md:h-screen md:overflow-y-auto md:border-r md:border-b-0">
      <div className="flex items-center gap-2 px-5 py-4">
        <span aria-hidden="true" className="size-[26px] rounded-lg bg-brand" />
        <span className="font-display text-[17px] font-bold">WAMI</span>
        <span className="rounded-full bg-night-soft px-2 py-0.5 text-[10px] font-bold tracking-widest">ADMIN</span>
        <button
          type="button"
          className="ml-auto rounded-lg px-2 py-1 text-sm font-semibold md:hidden"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          Menu
        </button>
      </div>
      <div className={cn("flex-col gap-0.5 px-3 pb-4 md:flex", open ? "flex" : "hidden")}>
        {groups.map((g) => (
          <div key={g.label} className="flex flex-col gap-0.5">
            <span className="px-2.5 pt-3 pb-1 text-[10.5px] font-bold uppercase tracking-wider text-muted">{g.label}</span>
            {g.items.map((i) => {
              const active = i.href === "/" ? pathname === "/" : pathname.startsWith(i.href);
              return (
                <Link
                  key={i.href}
                  href={i.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-8 items-center gap-2.5 rounded-[10px] px-2.5 text-[13px]",
                    active ? "bg-brand-soft font-bold text-brand-strong" : "text-ink hover:bg-field",
                  )}
                >
                  <span aria-hidden="true" className={cn("size-3.5 rounded", active ? "bg-brand" : "bg-[#C9CCD3]")} />
                  {i.label}
                </Link>
              );
            })}
          </div>
        ))}
        {user ? (
          <div className="mt-4 flex items-center gap-2.5 border-t border-[#E3E6EB] px-2 pt-3">
            <span className="flex size-[34px] items-center justify-center rounded-full bg-line text-xs font-bold">{initials(user.name)}</span>
            <span className="flex min-w-0 flex-1 flex-col">
              <b className="truncate text-[13px]">{user.name}</b>
              <span className="text-xs text-muted">{user.roleName ?? ROLE_LABELS[user.role]}</span>
            </span>
            <Button
              tone="ghost"
              size="sm"
              onClick={async () => {
                await logout();
                router.replace("/login");
              }}
            >
              Sortir
            </Button>
          </div>
        ) : null}
      </div>
    </nav>
  );
}

function Topbar() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (q.trim().length >= 2) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  };
  return (
    <header className="flex min-h-[60px] flex-wrap items-center gap-3 border-b border-line bg-white px-4 md:px-6">
      <form role="search" onSubmit={submit} className="flex h-9 max-w-[460px] flex-1 items-center gap-2 rounded-[10px] bg-field px-3 text-muted">
        <label htmlFor="global-search" className="sr-only">
          Rechercher
        </label>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-4-4" />
        </svg>
        <input
          id="global-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Mission, téléphone, partenaire, établissement…"
          className="w-full min-w-0 bg-transparent text-[13px] text-ink outline-none placeholder:text-muted"
        />
      </form>
      <span className="ml-auto hidden text-xs text-muted md:inline">Cotonou · ville unique pour l’instant (à valider)</span>
    </header>
  );
}

function Toaster() {
  const { toasts, dismiss } = useToast();
  return (
    <div aria-live="polite" className="fixed right-4 bottom-4 z-50 flex w-[min(360px,calc(100vw-32px))] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-start justify-between gap-3 rounded-xl px-3.5 py-2.5 text-[13px] shadow-lg",
            t.tone === "ok" && "bg-ok text-white",
            t.tone === "bad" && "bg-bad text-white",
            t.tone === "info" && "bg-night text-white",
          )}
        >
          <span>{t.text}</span>
          <button type="button" onClick={() => dismiss(t.id)} aria-label="Fermer le message" className="font-bold">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

/** Masque une page si le rôle n'y a pas accès (le backend refuse aussi). */
export function RequireAccess({ module, children }: { module: Module; children: ReactNode }) {
  const allowed = useSession((s) => s.can(module));
  if (!allowed) return <ErrorState message="Votre rôle ne donne pas accès à cette page." />;
  return <>{children}</>;
}

/** Vrai si l'agent peut agir (et pas seulement lire) sur le module. */
export function useCanWrite(module: Module): boolean {
  return useSession((s) => s.can(module, "write"));
}
