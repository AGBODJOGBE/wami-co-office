"use client";

import { useState } from "react";
import { useAction } from "@/shared/hooks/use-action";
import { useResource } from "@/shared/hooks/use-resource";
import { ago, dayMonth } from "@/shared/lib/format";
import { cn } from "@/shared/lib/cn";
import { useCanWrite } from "@/shared/ui/app-shell";
import { Button, Card, Field, fieldClass, InfoRow, Note, PageHeader, Segmented, Tag, type Tone } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { documentsUseCases } from "../application/documents.use-cases";
import { DOC_STATUS_LABELS, REJECT_REASONS, activationBlocker, completion, type DocStatus, type Dossier } from "../domain/dossier";

const DOC_TONE: Record<DocStatus, Tone> = { approved: "ok", pending: "info", rejected: "bad", missing: "neutral" };

export function DocumentsView() {
  const [kind, setKind] = useState<Dossier["kind"]>("pro");
  const dossiers = useResource(() => documentsUseCases.dossiers(kind), kind);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <>
      <PageHeader title="Vérifications">
        <Segmented
          label="Type de partenaire"
          value={kind}
          onChange={(k) => {
            setKind(k);
            setSelectedId(null);
          }}
          options={[
            ["pro", "Chauffeurs et livreurs"],
            ["establishment", "Établissements"],
          ]}
        />
      </PageHeader>
      <ResourceView state={dossiers} onRetry={dossiers.reload}>
        {(list) => {
          const selected = list.find((d) => d.id === selectedId) ?? list.find((d) => !d.activated) ?? null;
          return (
            <div className="grid gap-3.5 xl:grid-cols-[320px_minmax(0,1fr)]">
              <Card className="overflow-hidden">
                <ul>
                  {list.map((d) => {
                    const c = completion(d);
                    return (
                      <li key={d.id} className="border-b border-[#E3E6EB] last:border-b-0">
                        <button
                          type="button"
                          onClick={() => setSelectedId(d.id)}
                          aria-pressed={selected?.id === d.id}
                          className={cn("flex w-full items-center justify-between gap-2 px-4 py-3 text-left", selected?.id === d.id ? "bg-brand-soft" : "hover:bg-canvas")}
                        >
                          <span className="flex flex-col gap-0.5">
                            <b className="text-[13px]">{d.partnerName}</b>
                            <span className="text-xs text-muted">
                              {d.activity} · déposé {ago(d.submittedAt)}
                            </span>
                          </span>
                          {d.activated ? <Tag tone="ok">Actif</Tag> : <Tag tone={c.approved === c.total ? "ok" : "warn"}>{`${c.approved}/${c.total}`}</Tag>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </Card>
              {selected ? (
                <DossierPanel dossier={selected} onChange={(d) => dossiers.mutate((l) => l.map((x) => (x.id === d.id ? d : x)))} />
              ) : (
                <Card className="flex items-center justify-center p-6 text-sm text-muted">Aucun dossier.</Card>
              )}
            </div>
          );
        }}
      </ResourceView>
    </>
  );
}

function DossierPanel({ dossier, onChange }: { dossier: Dossier; onChange: (d: Dossier) => void }) {
  const { busy, run } = useAction();
  const canWrite = useCanWrite("documents");
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const blocker = activationBlocker(dossier);

  return (
    <Card className="flex flex-col gap-3 px-4 py-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex flex-col">
          <b className="text-[15px]">{dossier.partnerName}</b>
          <span className="text-xs text-muted">{dossier.activity}</span>
        </span>
        <Button
          tone="primary"
          busy={busy}
          disabled={!canWrite || Boolean(blocker)}
          onClick={async () => {
            const r = await run(() => documentsUseCases.activate(dossier), "Compte activé : le partenaire est prévenu par SMS.");
            if (r) onChange(r);
          }}
        >
          Activer le compte
        </Button>
      </div>
      {blocker && !dossier.activated ? <span className="text-xs text-muted">Activation impossible : {blocker}</span> : null}
      <div className="grid gap-3 lg:grid-cols-2">
        {dossier.documents.map((doc) => (
          <div key={doc.id} className="flex flex-col gap-2 rounded-xl border border-line p-3">
            <div className="flex items-center justify-between">
              <b className="text-[13px]">{doc.type}</b>
              <Tag tone={DOC_TONE[doc.status]}>{DOC_STATUS_LABELS[doc.status]}</Tag>
            </div>
            <div className="flex h-28 items-center justify-center rounded-lg bg-[#E3E6EB] text-xs text-muted">
              {doc.status === "missing" ? "Pas encore envoyée" : "Aperçu de la pièce (stockage à valider)"}
            </div>
            {doc.number ? <InfoRow label="Numéro">{doc.number}</InfoRow> : null}
            {doc.expiresAt ? <InfoRow label="Expire le">{dayMonth(doc.expiresAt)}</InfoRow> : null}
            {doc.rejectReason ? <InfoRow label="Motif du refus">{doc.rejectReason}</InfoRow> : null}
            {doc.status === "pending" ? (
              <div className="flex flex-wrap items-end gap-2">
                <Button
                  size="sm"
                  tone="primary"
                  disabled={!canWrite || busy}
                  onClick={async () => {
                    const r = await run(() => documentsUseCases.approve(dossier, doc), `${doc.type} validée.`);
                    if (r) onChange(r);
                  }}
                >
                  Valider
                </Button>
                <Field label="Motif de refus">
                  <select className={fieldClass} value={reasons[doc.id] ?? ""} onChange={(e) => setReasons({ ...reasons, [doc.id]: e.target.value })}>
                    <option value="">Choisir…</option>
                    {REJECT_REASONS.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </Field>
                <Button
                  size="sm"
                  tone="danger"
                  disabled={!canWrite || busy}
                  onClick={async () => {
                    const r = await run(() => documentsUseCases.reject(dossier, doc, reasons[doc.id] || null), `${doc.type} refusée : le partenaire doit la renvoyer.`);
                    if (r) onChange(r);
                  }}
                >
                  Refuser
                </Button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <InfoRow label="Formation en ligne">{dossier.trainingDone ? "Faite" : "À faire"}</InfoRow>
      <InfoRow label="Contrôle du véhicule">{dossier.inspection ?? "—"}</InfoRow>
      <Note>Pièces exigées par métier, casier judiciaire, délai cible et double validation à l’activation : à valider.</Note>
    </Card>
  );
}
