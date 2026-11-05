"use client";

import { useState } from "react";
import { useSession } from "@/shared/auth/session.store";
import { useAction } from "@/shared/hooks/use-action";
import { useResource } from "@/shared/hooks/use-resource";
import { dateTime, fcfa } from "@/shared/lib/format";
import { useCanWrite } from "@/shared/ui/app-shell";
import { DataTable } from "@/shared/ui/data-table";
import { Dialog } from "@/shared/ui/dialog";
import { Button, Card, Field, fieldClass, Note, PageHeader, Segmented, Tag, type Tone } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { grantsUseCases } from "../application/grants.use-cases";
import { GRANT_AUDIENCE_LABELS, GRANT_BALANCE_LABELS, GRANT_STATUS_LABELS, parseIds, type Grant, type GrantAudience, type GrantBalance, type GrantDraft, type GrantPreview, type GrantStatus } from "../domain/grant";

const TONE: Record<GrantStatus, Tone> = { pending: "warn", approved: "info", completed: "ok", partiallyFailed: "bad", rejected: "bad", cancelled: "neutral" };
const FILTERS = [["pending", "À approuver"], ["completed", "Terminées"], ["partiallyFailed", "À relancer"], ["all", "Toutes"]] as const;

export function GrantsView() {
  const [status, setStatus] = useState<GrantStatus | "all">("pending");
  const list = useResource(() => grantsUseCases.list(status), status);
  const canWrite = useCanWrite("wallet-grants");
  const actingId = useSession((s) => s.user?.id ?? "");
  const { busy, run } = useAction();
  const [creating, setCreating] = useState(false);
  const [rejecting, setRejecting] = useState<Grant | null>(null);

  const act = async (call: () => ReturnType<typeof grantsUseCases.cancel>, done: string) => {
    const r = await run(call, done);
    if (r !== undefined) list.reload();
  };

  return (
    <>
      <PageHeader title="Dotations de portefeuille">
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Segmented label="Filtrer par statut" options={FILTERS} value={status} onChange={setStatus} />
          <Button tone="primary" disabled={!canWrite} onClick={() => setCreating(true)}>
            Nouvelle dotation
          </Button>
        </div>
      </PageHeader>
      <Card className="overflow-hidden">
        <ResourceView state={list} onRetry={list.reload}>
          {(rows) => (
            <DataTable<Grant>
              rows={rows}
              rowKey={(g) => g.id}
              empty="Aucune dotation."
              columns={[
                { key: "label", header: "Libellé", render: (g) => <span className="flex flex-col"><b>{g.label}</b><span className="text-xs text-muted">{dateTime(g.createdAt)}</span></span> },
                { key: "aud", header: "Public", render: (g) => GRANT_AUDIENCE_LABELS[g.audience] },
                { key: "each", header: "Par personne", align: "right", render: (g) => `${fcfa(g.amountEach)} (${g.balance})` },
                { key: "n", header: "Bénéficiaires", align: "right", render: (g) => String(g.beneficiaries) },
                { key: "total", header: "Total", align: "right", render: (g) => <b>{fcfa(g.total)}</b> },
                { key: "done", header: "Crédités", align: "right", render: (g) => (g.status === "pending" ? "—" : `${g.credited}${g.failed ? ` (${g.failed} échecs)` : ""}`) },
                { key: "status", header: "Statut", render: (g) => <Tag tone={TONE[g.status]}>{GRANT_STATUS_LABELS[g.status]}</Tag> },
                {
                  key: "act",
                  header: "",
                  render: (g) => (
                    <span className="flex gap-1.5">
                      {g.status === "pending" ? (
                        <>
                          <Button size="sm" tone="primary" disabled={!canWrite || busy} onClick={() => act(() => grantsUseCases.approve(g, actingId), "Dotation approuvée : les crédits sont en cours.")}>
                            Approuver
                          </Button>
                          <Button size="sm" tone="danger" disabled={!canWrite || busy} onClick={() => setRejecting(g)}>
                            Rejeter
                          </Button>
                        </>
                      ) : null}
                      {g.status === "pending" || g.status === "approved" ? (
                        <Button size="sm" disabled={!canWrite || busy} onClick={() => act(() => grantsUseCases.cancel(g), "Dotation annulée.")}>
                          Annuler
                        </Button>
                      ) : null}
                      {g.status === "partiallyFailed" ? (
                        <Button size="sm" disabled={!canWrite || busy} onClick={() => act(() => grantsUseCases.retry(g), "Lignes échouées relancées.")}>
                          Relancer
                        </Button>
                      ) : null}
                    </span>
                  ),
                },
              ]}
            />
          )}
        </ResourceView>
      </Card>
      <Note>Une dotation est demandée par un agent et approuvée par un autre. Plafonds (par personne, total, nombre de bénéficiaires) : appliqués par le backend, à valider.</Note>
      {creating ? (
        <CreateDialog
          onClose={() => setCreating(false)}
          onDone={() => {
            setCreating(false);
            list.reload();
          }}
        />
      ) : null}
      {rejecting ? (
        <RejectDialog
          grant={rejecting}
          actingId={actingId}
          onClose={() => setRejecting(null)}
          onDone={() => {
            setRejecting(null);
            list.reload();
          }}
        />
      ) : null}
    </>
  );
}

function CreateDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [label, setLabel] = useState("");
  const [audience, setAudience] = useState<GrantAudience>("DRIVER");
  const [balance, setBalance] = useState<GrantBalance>("BONUS");
  const [amount, setAmount] = useState("");
  const [ids, setIds] = useState("");
  const [preview, setPreview] = useState<GrantPreview | null>(null);
  const { busy, run } = useAction();
  const draft = (): GrantDraft => ({ label, audience, balance, amountEach: Number(amount), beneficiaryIds: parseIds(ids) });

  return (
    <Dialog
      open
      title="Nouvelle dotation"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button
            busy={busy}
            onClick={async () => {
              const r = await run(() => grantsUseCases.preview(draft()));
              if (r) setPreview(r);
            }}
          >
            Aperçu
          </Button>
          <Button
            tone="primary"
            busy={busy}
            disabled={!preview || preview.unknownIds.length > 0 || preview.violations.length > 0}
            onClick={async () => {
              const r = await run(() => grantsUseCases.create(draft()), "Dotation demandée : un autre agent doit l’approuver.");
              if (r !== undefined) onDone();
            }}
          >
            Demander l’approbation
          </Button>
        </>
      }
    >
      <Field label="Libellé">
        <input className={fieldClass} value={label} onChange={(e) => { setLabel(e.target.value); setPreview(null); }} placeholder="Geste commercial lancement" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Public">
          <select className={fieldClass} value={audience} onChange={(e) => { setAudience(e.target.value as GrantAudience); setPreview(null); }}>
            {(Object.keys(GRANT_AUDIENCE_LABELS) as GrantAudience[]).map((a) => (
              <option key={a} value={a}>{GRANT_AUDIENCE_LABELS[a]}</option>
            ))}
          </select>
        </Field>
        <Field label="Solde crédité">
          <select className={fieldClass} value={balance} onChange={(e) => { setBalance(e.target.value as GrantBalance); setPreview(null); }}>
            {(Object.keys(GRANT_BALANCE_LABELS) as GrantBalance[]).map((b) => (
              <option key={b} value={b}>{GRANT_BALANCE_LABELS[b]}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Montant par bénéficiaire (F)">
        <input className={fieldClass} inputMode="numeric" value={amount} onChange={(e) => { setAmount(e.target.value.replace(/\D/g, "")); setPreview(null); }} />
      </Field>
      <Field label="Bénéficiaires" hint="Un identifiant par ligne (ou séparés par des virgules).">
        <textarea className={`${fieldClass} h-24 py-2`} value={ids} onChange={(e) => { setIds(e.target.value); setPreview(null); }} />
      </Field>
      {preview ? (
        <Note>
          {preview.beneficiaries} bénéficiaires · total {fcfa(preview.total)}
          {preview.inOverdraft ? ` · ${preview.inOverdraft} en dette (${fcfa(preview.absorbedByDebt)} absorbés)` : ""}
          {preview.unknownIds.length ? ` · identifiants inconnus : ${preview.unknownIds.join(", ")}` : ""}
          {preview.violations.length ? ` · plafonds dépassés : ${preview.violations.join(", ")}` : ""}
          {preview.notes.length ? ` · ${preview.notes.join(" ")}` : ""}
        </Note>
      ) : null}
    </Dialog>
  );
}

function RejectDialog({ grant, actingId, onClose, onDone }: { grant: Grant; actingId: string; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState("");
  const { busy, run } = useAction();
  return (
    <Dialog
      open
      title={`Rejeter « ${grant.label} »`}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button
            tone="danger"
            busy={busy}
            onClick={async () => {
              const r = await run(() => grantsUseCases.reject(grant, reason, actingId), "Dotation rejetée.");
              if (r !== undefined) onDone();
            }}
          >
            Rejeter
          </Button>
        </>
      }
    >
      <Field label="Motif du rejet">
        <input className={fieldClass} value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
    </Dialog>
  );
}
