/** Partenaires (entreprises, restaurants, commerces) en attente de validation par WAMI. */

export interface PendingPartner {
  id: string;
  company: string;
  type: string;
  phone: string;
  email: string | null;
  registrationNumber: string | null;
  createdAt: string;
}

/** Éléments qu'un agent doit vérifier avant de valider : numéro d'immatriculation et moyen de contact. */
export function missingChecks(p: PendingPartner): string[] {
  const missing: string[] = [];
  if (!p.registrationNumber) missing.push("numéro d'immatriculation");
  if (!p.email) missing.push("e-mail");
  return missing;
}

export function validateBlocker(p: PendingPartner, confirmed: boolean): string | null {
  if (!p.phone.trim()) return "Aucun téléphone de contact : impossible de joindre le partenaire.";
  if (missingChecks(p).length > 0 && !confirmed) return `Il manque : ${missingChecks(p).join(", ")}. Cochez la confirmation pour valider quand même.`;
  return null;
}
