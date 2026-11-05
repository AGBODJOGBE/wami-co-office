"use client";

import { useState } from "react";
import { useResource } from "@/shared/hooks/use-resource";
import { dayMonth, fcfa } from "@/shared/lib/format";
import { DataTable } from "@/shared/ui/data-table";
import { Dialog } from "@/shared/ui/dialog";
import { Button, Card, CardHeader, Field, fieldClass, Kpi, Note, PageHeader, Tag } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { receivablesUseCases } from "../application/receivables.use-cases";
import { ageDays, type CommissionDebt, type OutflowLine, type Receivable, type RevenueLine } from "../domain/receivables";

export function ReceivablesView() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const period = `${from}|${to}`;
  const revenue = useResource(() => receivablesUseCases.revenue(from ? `${from}T00:00:00Z` : undefined, to ? `${to}T23:59:59Z` : undefined), period);
  const overview = useResource(() => receivablesUseCases.overview(), "overview");
  const debts = useResource(() => receivablesUseCases.debts(), "debts");
  const [detail, setDetail] = useState<CommissionDebt | null>(null);
  const [now] = useState(() => new Date());

  return (
    <>
      <PageHeader title="Revenus et créances">
        <div className="ml-auto flex items-end gap-2">
          <Field label="Du">
            <input className={fieldClass} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="Au">
            <input className={fieldClass} type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
        </div>
      </PageHeader>
      <ResourceView state={revenue} onRetry={revenue.reload}>
        {(r) => (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Kpi label="Revenus" value={fcfa(r.totalRevenue)} />
              <Kpi label="Sorties" value={fcfa(r.outflows)} />
              <Kpi label="Résultat net" value={fcfa(r.net)} />
              <Kpi label="Solde plateforme" value={fcfa(r.balance)} />
            </div>
            <div className="grid gap-3.5 lg:grid-cols-2">
              <Card className="overflow-hidden">
                <CardHeader title="Revenus par source" />
                <DataTable<RevenueLine> rows={r.breakdown} rowKey={(b) => b.source} columns={[{ key: "l", header: "Source", render: (b) => b.label }, { key: "t", header: "Total", align: "right", render: (b) => fcfa(b.total) }]} />
              </Card>
              <Card className="overflow-hidden">
                <CardHeader title="Sorties" />
                <DataTable<OutflowLine>
                  rows={r.outflowBreakdown}
                  rowKey={(b) => b.source}
                  columns={[
                    { key: "l", header: "Poste", render: (b) => b.label },
                    { key: "c", header: "Nature", render: (b) => <Tag tone={b.category === "DEFINITIVE_EXPENSE" ? "bad" : "neutral"}>{b.category === "DEFINITIVE_EXPENSE" ? "Dépense" : "Mouvement"}</Tag> },
                    { key: "t", header: "Total", align: "right", render: (b) => fcfa(b.total) },
                  ]}
                />
              </Card>
            </div>
          </>
        )}
      </ResourceView>
      <Card className="overflow-hidden">
        <CardHeader title="Ce que doivent les chauffeurs (contrats et commissions)" />
        <ResourceView state={overview} onRetry={overview.reload}>
          {(o) => (
            <>
              <div className="grid grid-cols-3 gap-3 p-4 pb-0">
                <Kpi label="Contrats" value={fcfa(o.contract)} />
                <Kpi label="Commissions" value={fcfa(o.commission)} />
                <Kpi label="Total à recouvrer" value={fcfa(o.total)} />
              </div>
              <DataTable<Receivable>
                rows={o.rows}
                rowKey={(d) => d.driverId}
                empty="Aucune créance."
                columns={[
                  { key: "n", header: "Chauffeur", render: (d) => <b>{d.driverName}</b> },
                  { key: "c", header: "Contrat", align: "right", render: (d) => fcfa(d.contract) },
                  { key: "m", header: "Commissions", align: "right", render: (d) => fcfa(d.commission) },
                  { key: "t", header: "Total", align: "right", render: (d) => <b>{fcfa(d.total)}</b> },
                  { key: "a", header: "Plus ancienne", align: "right", render: (d) => (d.oldestAt ? `${dayMonth(d.oldestAt)} (${ageDays(d.oldestAt, now)} j)` : "—") },
                ]}
              />
            </>
          )}
        </ResourceView>
      </Card>
      <Card className="overflow-hidden">
        <CardHeader title="Dettes de commission (portefeuilles en négatif)" />
        <ResourceView state={debts} onRetry={debts.reload}>
          {(d) => (
            <>
              <p className="px-4 pt-3 text-sm">
                Total : <b>{fcfa(d.total)}</b>
              </p>
              <DataTable<CommissionDebt>
                rows={d.rows}
                rowKey={(x) => x.driverId}
                empty="Aucune dette."
                columns={[
                  { key: "n", header: "Chauffeur", render: (x) => <span className="flex flex-col"><b>{x.driverName}</b><span className="text-xs text-muted">{x.phone}</span></span> },
                  { key: "s", header: "Statut", render: (x) => x.status || "—" },
                  { key: "a", header: "Dette", align: "right", render: (x) => <b className="text-bad">{fcfa(x.amount)}</b> },
                  { key: "d", header: "", render: (x) => <Button size="sm" onClick={() => setDetail(x)}>Détail</Button> },
                ]}
              />
            </>
          )}
        </ResourceView>
      </Card>
      <Note>Les commissions en espèces non reversées créent une dette sur le portefeuille du chauffeur ; son recouvrement passe par les gains futurs ou un versement en agence.</Note>
      {detail ? <DebtDialog debt={detail} onClose={() => setDetail(null)} /> : null}
    </>
  );
}

function DebtDialog({ debt, onClose }: { debt: CommissionDebt; onClose: () => void }) {
  const lines = useResource(() => receivablesUseCases.debtLines(debt.driverId), debt.driverId);
  return (
    <Dialog open title={`Dette · ${debt.driverName}`} onClose={onClose} footer={<Button onClick={onClose}>Fermer</Button>}>
      <ResourceView state={lines} onRetry={lines.reload}>
        {(rows) => (
          <DataTable
            rows={rows}
            rowKey={(l) => l.id}
            empty="Aucune ligne."
            columns={[
              { key: "d", header: "Date", render: (l) => dayMonth(l.date) },
              { key: "s", header: "Origine", render: (l) => `${l.source} · ${l.number}` },
              { key: "a", header: "Commission", align: "right", render: (l) => fcfa(l.amount) },
            ]}
          />
        )}
      </ResourceView>
    </Dialog>
  );
}
