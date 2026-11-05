"use client";

import { useState } from "react";
import { useAction } from "@/shared/hooks/use-action";
import { useResource } from "@/shared/hooks/use-resource";
import { dateTime, fcfa } from "@/shared/lib/format";
import { useCanWrite } from "@/shared/ui/app-shell";
import { DataTable } from "@/shared/ui/data-table";
import { Dialog } from "@/shared/ui/dialog";
import { Button, Card, Field, fieldClass, Note, PageHeader, Segmented, Tag, type Tone } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { withdrawalsUseCases } from "../application/withdrawals.use-cases";
import { WITHDRAWAL_STATUS_LABELS, isAwaiting, type Withdrawal, type WithdrawalStatus } from "../domain/withdrawal";

const TONE: Record<WithdrawalStatus, Tone> = { awaiting: "warn", pending: "neutral", processing: "info", completed: "ok", failed: "bad", cancelled: "neutral", rejected: "bad" };
const FILTERS = [["awaiting", "À valider"], ["completed", "Terminés"], ["rejected", "Rejetés"], ["all", "Tous"]] as const;

export function WithdrawalsView() {
  const [status, setStatus] = useState<WithdrawalStatus | "all">("awaiting");
  const list = useResource(() => withdrawalsUseCases.list(status), status);
  const canWrite = useCanWrite("withdrawals");
  const { busy, run } = useAction();
  const [rejecting, setRejecting] = useState<Withdrawal | null>(null);

  return (
    <>
      <PageHeader title="Retraits">
        <div className="ml-auto">
          <Segmented label="Filtrer par statut" options={FILTERS} value={status} onChange={setStatus} />
        </div>
      </PageHeader>
      <Card className="overflow-hidden">
        <ResourceView state={list} onRetry={list.reload}>
          {(rows) => (
            <DataTable<Withdrawal>
              rows={rows}
              rowKey={(w) => w.id}
              empty="Aucun retrait."
              columns={[
                { key: "date", header: "Demandé le", render: (w) => dateTime(w.createdAt) },
                { key: "owner", header: "Titulaire", render: (w) => <span className="flex flex-col"><b>{w.ownerName}</b><span className="text-xs text-muted">{w.phone}</span></span> },
                { key: "amount", header: "Montant", align: "right", render: (w) => <b>{fcfa(w.amount)}</b> },
                { key: "source", header: "Origine", render: (w) => (w.source === "AFFILIATE" ? <Tag tone="info">Commissions</Tag> : "Gains") },
                { key: "to", header: "Vers", render: (w) => `${w.method} · ${w.recipient}` },
                {
                  key: "status",
                  header: "Statut",
                  render: (w) => (
                    <span className="flex flex-col gap-0.5">
                      <Tag tone={TONE[w.status]}>{WITHDRAWAL_STATUS_LABELS[w.status]}</Tag>
                      {w.rejectionReason || w.failureReason ? <span className="whitespace-normal text-xs text-muted">{w.rejectionReason ?? w.failureReason}</span> : null}
                    </span>
                  ),
                },
                {
                  key: "act",
                  header: "",
                  render: (w) =>
                    isAwaiting(w) ? (
                      <span className="flex gap-1.5">
                        <Button
                          size="sm"
                          tone="primary"
                          disabled={!canWrite || busy}
                          onClick={async () => {
                            const r = await run(() => withdrawalsUseCases.approve(w), `Retrait de ${fcfa(w.amount)} approuvé.`);
                            if (r !== undefined) list.reload();
                          }}
                        >
                          Approuver
                        </Button>
                        <Button size="sm" tone="danger" disabled={!canWrite || busy} onClick={() => setRejecting(w)}>
                          Rejeter
                        </Button>
                      </span>
                    ) : null,
                },
              ]}
            />
          )}
        </ResourceView>
      </Card>
      <Note>Un rejet recrédite le montant réservé sur le portefeuille. Seuil de validation manuelle et délais de traitement : définis côté backend, à valider.</Note>
      {rejecting ? (
        <RejectDialog
          withdrawal={rejecting}
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

function RejectDialog({ withdrawal, onClose, onDone }: { withdrawal: Withdrawal; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState("");
  const { busy, run } = useAction();
  return (
    <Dialog
      open
      title={`Rejeter le retrait de ${fcfa(withdrawal.amount)}`}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button
            tone="danger"
            busy={busy}
            onClick={async () => {
              const r = await run(() => withdrawalsUseCases.reject(withdrawal, reason), "Retrait rejeté : le montant est recrédité.");
              if (r !== undefined) onDone();
            }}
          >
            Rejeter
          </Button>
        </>
      }
    >
      <Field label="Motif du rejet" hint="Il est conservé et visible dans l’historique.">
        <input className={fieldClass} value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
    </Dialog>
  );
}
