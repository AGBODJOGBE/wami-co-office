"use client";

import { create } from "zustand";
import type { Module } from "./permissions";
import { can } from "./permissions";
import type { SessionUser } from "./session";

interface SessionState {
  user: SessionUser | null;
  loaded: boolean;
  load: () => Promise<void>;
  logout: () => Promise<void>;
  can: (module: Module, need?: "read" | "write") => boolean;
}

/** Session de l'agent : seul état global de l'application. */
export const useSession = create<SessionState>((set, get) => ({
  user: null,
  loaded: false,
  load: async () => {
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      const data = res.ok ? ((await res.json()) as { user: SessionUser | null }) : { user: null };
      set({ user: data.user, loaded: true });
    } catch {
      set({ user: null, loaded: true });
    }
  },
  /** Supprime le cookie de session ; la redirection vers /login est faite par l'appelant. */
  logout: async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    set({ user: null, loaded: false });
  },
  can: (module, need = "read") => can(get().user?.role, module, need),
}));
