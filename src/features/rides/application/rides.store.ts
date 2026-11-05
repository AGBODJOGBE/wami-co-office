"use client";

import { create } from "zustand";
import type { RideFilter } from "../domain/ride";

/** Filtres de la liste des courses, conservés entre deux visites de la page. */
interface RidesUiState extends RideFilter {
  setStatus: (s: RideFilter["status"]) => void;
  setQ: (q: string) => void;
}

export const useRidesUi = create<RidesUiState>((set) => ({
  status: "all",
  q: "",
  setStatus: (status) => set({ status }),
  setQ: (q) => set({ q }),
}));
