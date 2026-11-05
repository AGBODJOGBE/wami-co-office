"use client";

import { useAction } from "@/shared/hooks/use-action";
import { useResource } from "@/shared/hooks/use-resource";
import { fcfa } from "@/shared/lib/format";
import { useCanWrite } from "@/shared/ui/app-shell";
import { DataTable } from "@/shared/ui/data-table";
import { Button, Card, Kpi, Note, PageHeader, Tag } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { affiliateUseCases } from "../application/affiliate.use-cases";
import { MIN_AFFILIATE_PAYOUT, due, earned, type Affiliate } from "../domain/affiliate";

export function AffiliateView() {
  const list = useResource(() => affiliateUseCases.list(), "affiliates");
  const canWrite = useCanWrite("affiliate");
  const { busy, run } = useAction();

  return (
    <>
      <PageHeader title="Affiliation (apporteurs de partenaires)" />
      <ResourceView state={list} onRetry={list.reload}>
        {(rows) => (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Kpi label="Affiliés actifs" value={String(rows.filter((a) => a.status === "active").length)} />
              <Kpi label="Partenaires apportés" value={String(rows.reduce((s, a) => s + a.activations, 0))} hint={`${rows.reduce((s, a) => s + a.pending, 0)} en vérification`} />
              <Kpi label="Commissions gagnées" value={fcfa(rows.reduce((s, a) => s + earned(a), 0))} />
              <Kpi label="Reste à verser" value={fcfa(rows.reduce((s, a) => s + due(a), 0))} />
            </div>
            <Card className="overflow-hidden">
              <DataTable<Affiliate>
                rows={rows}
                rowKey={(a) => a.id}
                columns={[
                  { key: "name", header: "Affilié", render: (a) => <b>{a.name}</b> },
                  { key: "kind", header: "Type", render: (a) => (a.kind === "agency" ? "Agence" : "Particulier") },
                  { key: "code", header: "Code", render: (a) => a.code },
                  { key: "act", header: "Activés", align: "right", render: (a) => `${a.activations} (+${a.pending})` },
                  { key: "rate", header: "Par activation", align: "right", render: (a) => fcfa(a.ratePerActivation) },
                  { key: "earned", header: "Gagné", align: "right", render: (a) => fcfa(earned(a)) },
                  { key: "due", header: "Dû", align: "right", render: (a) => <b>{fcfa(due(a))}</b> },
                  { key: "status", header: "", render: (a) => (a.status === "suspended" ? <Tag tone="bad">Suspendu</Tag> : null) },
                  {
                    key: "pay",
                    header: "",
                    render: (a) =>
                      due(a) >= MIN_AFFILIATE_PAYOUT ? (
                        <Button
                          size="sm"
                          tone="primary"
                          disabled={!canWrite || busy}
                          onClick={async () => {
                            const r = await run(() => affiliateUseCases.pay(a, due(a)), `${fcfa(due(a))} versés à ${a.name}.`);
                            if (r) list.mutate((l) => l.map((x) => (x.id === r.id ? r : x)));
                          }}
                        >
                          Verser {fcfa(due(a))}
                        </Button>
                      ) : null,
                  },
                ]}
              />
            </Card>
          </>
        )}
      </ResourceView>
      <Note>Montant par activation, condition d’activité minimale du partenaire recruté (ex. 20 missions) et contrat d’apporteur : à valider.</Note>
    </>
  );
}
