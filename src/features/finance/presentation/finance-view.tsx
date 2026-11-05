"use client";

import { useState } from "react";
import { useSession } from "@/shared/auth/session.store";
import { useAction } from "@/shared/hooks/use-action";
import { useResource } from "@/shared/hooks/use-resource";
import { dayMonth, fcfa } from "@/shared/lib/format";
import { useCanWrite } from "@/shared/ui/app-shell";
import { DataTable } from "@/shared/ui/data-table";
import { Button, Card, CardHeader, Kpi, KpiGrid, Note, PageHeader, Tag } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { financeUseCases } from "../application/finance.use-cases";
import { isPayable, net, selectionTotal, type PayoutBatch, type PayoutLine } from "../domain/payout";

const BATCH_STATUS: Record<PayoutBatch["status"], string> = { draft: "Brouillon", submitted: "Soumis, à approuver", approved: "Approuvé", paid: "Versé" };

export function FinanceView() {
  const summary = useResource(() => financeUseCases.summary(), "summary");
  const batch = useResource(() => financeUseCases.currentBatch(), "batch");

  return (
    <>
      <PageHeader title="Finances et versements">
        <Button className="ml-auto" disabled title="Export comptable : format à valider">
          Exporter pour la comptabilité
        </Button>
      </PageHeader>
      <ResourceView state={summary} onRetry={summary.reload}>
        {(s) => (
          <KpiGrid>
            <Kpi label="Encaissé par WAMI" value={fcfa(s.collected)} hint="app, Mobile Money" />
            <Kpi label="Commission WAMI" value={fcfa(s.commission)} />
            <Kpi label="À verser" value={fcfa(s.toPay)} />
            <Kpi label="Commission due (espèces)" value={fcfa(s.cashCommissionDue)} hint={`par ${s.cashCommissionDebtors} chauffeurs`} />
            <Kpi label="Remboursements" value={fcfa(s.refunds)} />
          </KpiGrid>
        )}
      </ResourceView>
      <ResourceView state={batch} onRetry={batch.reload}>
        {(b) => <BatchCard key={b.status} batch={b} onChange={(nb) => batch.mutate(() => nb)} />}
      </ResourceView>
      <Note>Fréquence des versements, frais Mobile Money, traitement des soldes négatifs (report ou réclamation) et mentions fiscales des relevés : à valider avec la Finance.</Note>
    </>
  );
}

function BatchCard({ batch: b, onChange }: { batch: PayoutBatch; onChange: (b: PayoutBatch) => void }) {
  const agentId = useSession((s) => s.user?.id ?? "");
  const canWrite = useCanWrite("finance");
  const { busy, run } = useAction();
  const [selected, setSelected] = useState<string[]>(b.status === "draft" ? b.lines.filter(isPayable).map((l) => l.id) : b.selectedIds);
  const editable = b.status === "draft";

  return (
    <Card className="overflow-hidden">
      <CardHeader title={`Lot de versement · ${dayMonth(b.payoutDate)}`}>
        <span className="flex items-center gap-2 text-xs text-muted">
          <Tag tone={b.status === "draft" ? "neutral" : b.status === "submitted" ? "warn" : "ok"}>{BATCH_STATUS[b.status]}</Tag>
          {b.preparedBy ? `préparé par ${b.preparedBy}` : null}
        </span>
      </CardHeader>
      <DataTable<PayoutLine>
        rows={b.lines}
        rowKey={(l) => l.id}
        columns={[
          {
            key: "sel",
            header: "Inclure",
            render: (l) => (
              <input
                type="checkbox"
                aria-label={`Inclure ${l.beneficiary}`}
                checked={selected.includes(l.id)}
                disabled={!editable || !isPayable(l)}
                onChange={(e) => setSelected(e.target.checked ? [...selected, l.id] : selected.filter((x) => x !== l.id))}
              />
            ),
          },
          { key: "who", header: "Bénéficiaire", render: (l) => <b>{l.beneficiary}</b> },
          { key: "type", header: "Type", render: (l) => (l.type === "pro" ? "Chauffeur / livreur" : "Établissement") },
          { key: "sales", header: "Ventes", align: "right", render: (l) => fcfa(l.sales) },
          { key: "com", header: "Commission", align: "right", render: (l) => fcfa(-l.commission) },
          { key: "adj", header: "Ajustements", align: "right", render: (l) => (l.adjustments ? fcfa(l.adjustments, { signed: true }) : "—") },
          { key: "net", header: "Net", align: "right", render: (l) => <b className={net(l) < 0 ? "text-bad" : undefined}>{fcfa(net(l))}</b> },
          { key: "method", header: "Moyen", render: (l) => l.method },
          {
            key: "status",
            header: "Statut",
            render: (l) =>
              l.status === "failed" ? <Tag tone="bad">{l.failureReason ?? "Échec"}</Tag> : net(l) <= 0 ? <Tag tone="warn">Solde négatif</Tag> : <Tag tone="ok">Prêt</Tag>,
          },
        ]}
      />
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <span className="text-xs text-muted">
          Sélection : {selected.length} · {fcfa(selectionTotal(b, selected))}
        </span>
        <span className="flex gap-2">
          {b.status === "draft" ? (
            <Button
              tone="primary"
              busy={busy}
              disabled={!canWrite}
              onClick={async () => {
                const r = await run(() => financeUseCases.submit(b, selected), "Lot soumis : une autre personne doit l’approuver.");
                if (r) onChange(r);
              }}
            >
              Soumettre à validation
            </Button>
          ) : null}
          {b.status === "submitted" ? (
            <Button
              tone="primary"
              busy={busy}
              disabled={!canWrite}
              onClick={async () => {
                const r = await run(() => financeUseCases.approve(b, agentId), "Lot approuvé : les virements partent à la date prévue.");
                if (r) onChange(r);
              }}
            >
              Approuver le lot
            </Button>
          ) : null}
        </span>
      </div>
    </Card>
  );
}
