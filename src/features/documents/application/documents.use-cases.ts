import { fail, guard, type Result } from "@/shared/lib/result";
import { activationBlocker, reviewBlocker, type Dossier, type PartnerDocument } from "../domain/dossier";
import type { DocumentsRepository } from "../domain/documents.repository";
import { HttpDocumentsRepository } from "./documents.http-repository";

export function createDocumentsUseCases(repo: DocumentsRepository, clock: () => Date = () => new Date()) {
  return {
    dossiers: (kind: Dossier["kind"]) => guard(() => repo.dossiers(kind)),
    approve: (d: Dossier, doc: PartnerDocument): Promise<Result<Dossier>> => {
      const blocker = reviewBlocker(doc, "approve", null, clock());
      if (blocker) return Promise.resolve(fail("validation", blocker));
      return guard(() => repo.review(d.id, doc.id, "approve", null));
    },
    reject: (d: Dossier, doc: PartnerDocument, reason: string | null): Promise<Result<Dossier>> => {
      const blocker = reviewBlocker(doc, "reject", reason, clock());
      if (blocker) return Promise.resolve(fail("validation", blocker));
      return guard(() => repo.review(d.id, doc.id, "reject", reason));
    },
    activate: (d: Dossier): Promise<Result<Dossier>> => {
      const blocker = activationBlocker(d);
      if (blocker) return Promise.resolve(fail("validation", blocker));
      return guard(() => repo.activate(d.id));
    },
  };
}

export const documentsUseCases = createDocumentsUseCases(new HttpDocumentsRepository());
