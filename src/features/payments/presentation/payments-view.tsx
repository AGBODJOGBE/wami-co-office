"use client";

import { useState } from "react";
import { useResource } from "@/shared/hooks/use-resource";
import { dateTime, fcfa, percent } from "@/shared/lib/format";
import { DataTable } from "@/shared/ui/data-table";
import { Card, fieldClass, Kpi, PageHeader, Segmented, Tag, type Tone } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { paymentsUseCases } from "../application/payments.use-cases";
import { PAYMENT_STATUS_LABELS, totals, type Payment, type PaymentStatus } from "../domain/payment";

const TONE: Record<PaymentStatus, Tone> = { pending: "info", success: "ok", failed: "bad", other: "neutral" };
const FILTERS = [["all", "Tous"], ["pending", "En cours"], ["success", "Réussis"], ["failed", "Échoués"]] as const;

export function PaymentsView() {
  const [status, setStatus] = useState<PaymentStatus | "all">("all");
  const [provider, setProvider] = useState("");
  const list = useResource(() => paymentsUseCases.list({ status, provider }), `${status}|${provider}`);

  return (
    <>
      <PageHeader title="Paiements Mobile Money">
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <select aria-label="Prestataire" className={`${fieldClass} w-40`} value={provider} onChange={(e) => setProvider(e.target.value)}>
            <option value="">Tous les prestataires</option>
            <option value="FEDAPAY">FedaPay</option>
            <option value="MTN_MOMO">MTN MoMo</option>
          </select>
          <Segmented label="Statut" options={FILTERS} value={status} onChange={setStatus} />
        </div>
      </PageHeader>
      <ResourceView state={list} onRetry={list.reload}>
        {(rows) => {
          const t = totals(rows);
          return (
            <>
              <div className="grid grid-cols-3 gap-3">
                <Kpi label="Paiements" value={String(t.count)} />
                <Kpi label="Encaissé (réussis)" value={fcfa(t.amount)} />
                <Kpi label="Taux d’échec" value={percent(t.failureRate, 1)} />
              </div>
              <Card className="overflow-hidden">
                <DataTable<Payment>
                  rows={rows}
                  rowKey={(p) => p.id}
                  empty="Aucun paiement."
                  columns={[
                    { key: "d", header: "Date", render: (p) => dateTime(p.createdAt) },
                    { key: "o", header: "Titulaire", render: (p) => <span className="flex flex-col"><b>{p.ownerName}</b><span className="text-xs text-muted">{p.phone}</span></span> },
                    { key: "op", header: "Opération", render: (p) => p.operation },
                    { key: "pr", header: "Prestataire", render: (p) => p.provider },
                    { key: "a", header: "Montant", align: "right", render: (p) => fcfa(p.amount) },
                    { key: "s", header: "Statut", render: (p) => <span className="flex flex-col gap-0.5"><Tag tone={TONE[p.status]}>{PAYMENT_STATUS_LABELS[p.status]}</Tag>{p.failureReason ? <span className="whitespace-normal text-xs text-muted">{p.failureReason}</span> : null}</span> },
                  ]}
                />
              </Card>
            </>
          );
        }}
      </ResourceView>
    </>
  );
}
