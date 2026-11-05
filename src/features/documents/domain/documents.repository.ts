import type { Dossier } from "./dossier";

export interface DocumentsRepository {
  dossiers(kind: Dossier["kind"]): Promise<Dossier[]>;
  review(dossierId: string, docId: string, decision: "approve" | "reject", reason: string | null): Promise<Dossier>;
  activate(dossierId: string): Promise<Dossier>;
}
