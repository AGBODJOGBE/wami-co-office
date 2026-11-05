/** Vérification des pièces des partenaires (chauffeurs, livreurs, établissements). */

export type DocStatus = "missing" | "pending" | "approved" | "rejected";

export const DOC_STATUS_LABELS: Record<DocStatus, string> = {
  missing: "Manquante",
  pending: "À vérifier",
  approved: "Validée",
  rejected: "Refusée",
};

export const REJECT_REASONS = ["Illisible", "Expirée", "Ne correspond pas au compte", "Pièce incomplète", "Autre"] as const;
export type RejectReason = (typeof REJECT_REASONS)[number];

export interface PartnerDocument {
  id: string;
  type: string;
  status: DocStatus;
  number: string | null;
  expiresAt: string | null;
  submittedAt: string | null;
  rejectReason: string | null;
}

export interface Dossier {
  id: string;
  partnerName: string;
  kind: "pro" | "establishment";
  activity: string;
  submittedAt: string;
  trainingDone: boolean;
  inspection: string | null;
  documents: PartnerDocument[];
  activated: boolean;
}

export function completion(d: Dossier): { approved: number; total: number } {
  return { approved: d.documents.filter((x) => x.status === "approved").length, total: d.documents.length };
}

/** Activation : toutes les pièces validées et la formation faite. */
export function activationBlocker(d: Dossier): string | null {
  if (d.activated) return "Compte déjà actif.";
  const notOk = d.documents.filter((x) => x.status !== "approved");
  if (notOk.length > 0) return `${notOk.length} pièce(s) non validée(s).`;
  if (d.kind === "pro" && !d.trainingDone) return "La formation en ligne n’est pas faite.";
  return null;
}

export function reviewBlocker(doc: PartnerDocument, decision: "approve" | "reject", reason: string | null, now: Date): string | null {
  if (doc.status !== "pending") return "Seule une pièce « à vérifier » peut être traitée.";
  if (decision === "reject" && !reason) return "Choisissez un motif de refus.";
  if (decision === "approve" && doc.expiresAt && new Date(doc.expiresAt) < now) return "Pièce expirée : refusez-la avec le motif « Expirée ».";
  return null;
}
