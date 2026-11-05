import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { Dossier } from "../domain/dossier";
import type { DocumentsRepository } from "../domain/documents.repository";

export class HttpDocumentsRepository implements DocumentsRepository {
  dossiers(kind: Dossier["kind"]) {
    return http.get<Dossier[]>(API.documents.dossiers, { kind });
  }
  review(dossierId: string, docId: string, decision: "approve" | "reject", reason: string | null) {
    return http.post<Dossier>(API.documents.review(dossierId, docId), { decision, reason });
  }
  activate(dossierId: string) {
    return http.post<Dossier>(API.documents.activate(dossierId));
  }
}
