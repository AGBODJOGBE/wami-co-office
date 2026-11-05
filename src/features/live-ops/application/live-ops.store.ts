"use client";

import { create } from "zustand";
import type { ServiceKind } from "../domain/live-ops";

/** Filtres et sélection de l'écran « En direct » : conservés quand on change de page. */
interface LiveOpsUiState {
  kind: ServiceKind | "all";
  onlyProblems: boolean;
  selectedId: string | null;
  setKind: (k: ServiceKind | "all") => void;
  toggleProblems: () => void;
  select: (id: string | null) => void;
}

export const useLiveOpsUi = create<LiveOpsUiState>((set) => ({
  kind: "all",
  onlyProblems: false,
  selectedId: null,
  setKind: (kind) => set({ kind }),
  toggleProblems: () => set((s) => ({ onlyProblems: !s.onlyProblems })),
  select: (selectedId) => set({ selectedId }),
}));
