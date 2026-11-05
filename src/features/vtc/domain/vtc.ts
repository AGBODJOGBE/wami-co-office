/** Offres VTC : catégories de véhicules proposées au client pour une course. */

export interface ServiceCategory {
  key: string;
  label: string;
  vehicle: "moto" | "car" | "tricycle";
  seats: number;
  description: string;
  active: boolean;
  /** Partenaires en ligne dans cette catégorie. */
  onlinePartners: number;
}

/** Il doit toujours rester au moins une catégorie de course proposée. */
export function deactivateBlocker(cat: ServiceCategory, all: ServiceCategory[]): string | null {
  if (!cat.active) return null;
  const othersActive = all.filter((c) => c.key !== cat.key && c.active).length;
  if (othersActive === 0) return "Impossible : ce serait la dernière offre active.";
  return null;
}
