"use client";

import { useState } from "react";
import { useAction } from "@/shared/hooks/use-action";
import { useResource } from "@/shared/hooks/use-resource";
import { dayMonth, fcfa } from "@/shared/lib/format";
import { useCanWrite } from "@/shared/ui/app-shell";
import { DataTable } from "@/shared/ui/data-table";
import { Dialog } from "@/shared/ui/dialog";
import { Button, Card, Field, fieldClass, Kpi, Note, PageHeader, Tag, type Tone } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { contractsUseCases } from "../application/contracts.use-cases";
import { LEASE_HEALTH_LABELS, arrears, health, paidAmount, remaining, weeksElapsed, type LeaseContract, type LeaseHealth, type LeasePayment } from "../domain/lease-contract";

const HEALTH_TONE: Record<LeaseHealth, Tone> = { settled: "ok", upToDate: "info", late: "warn", critical: "bad" };

export function ContractsView() {
  const contracts = useResource(() => contractsUseCases.list(), "contracts");
  const [paying, setPaying] = useState<LeaseContract | null>(null);
  const canWrite = useCanWrite("contracts");
  const [now] = useState(() => new Date());

  return (
    <>
      <PageHeader title="Contrats de location-vente (WAMI-CO)" />
      <ResourceView state={contracts} onRetry={contracts.reload}>
        {(list) => {
          const active = list.filter((c) => c.status === "active");
          const totalArrears = active.reduce((s, c) => s + arrears(c, now), 0);
          return (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Kpi label="Contrats actifs" value={String(active.length)} />
                <Kpi label="Encaissé" value={fcfa(list.reduce((s, c) => s + paidAmount(c), 0))} />
                <Kpi label="Reste à encaisser" value={fcfa(active.reduce((s, c) => s + remaining(c), 0))} />
                <Kpi label="Impayés à date" value={fcfa(totalArrears)} hint={`${active.filter((c) => arrears(c, now) > 0).length} contrats en retard`} />
              </div>
              <Card className="overflow-hidden">
                <DataTable<LeaseContract>
                  rows={list}
                  rowKey={(c) => c.id}
                  columns={[
                    { key: "driver", header: "Chauffeur", render: (c) => <b>{c.driverName}</b> },
                    { key: "veh", header: "Véhicule", render: (c) => `${c.vehicleLabel} · ${c.plate}` },
                    { key: "start", header: "Début", render: (c) => dayMonth(c.startDate) },
                    { key: "weeks", header: "Semaine", align: "right", render: (c) => `${weeksElapsed(c, now)} / ${c.weeks}` },
                    { key: "weekly", header: "Échéance", align: "right", render: (c) => fcfa(c.weeklyInstallment) },
                    { key: "paid", header: "Payé", align: "right", render: (c) => fcfa(paidAmount(c)) },
                    { key: "rest", header: "Reste", align: "right", render: (c) => fcfa(remaining(c)) },
                    { key: "arrears", header: "Impayé", align: "right", render: (c) => (arrears(c, now) ? <b className="text-bad">{fcfa(arrears(c, now))}</b> : "—") },
                    { key: "health", header: "État", render: (c) => <Tag tone={HEALTH_TONE[health(c, now)]}>{LEASE_HEALTH_LABELS[health(c, now)]}</Tag> },
                    {
                      key: "act",
                      header: "",
                      render: (c) =>
                        c.status === "active" && remaining(c) > 0 ? (
                          <Button size="sm" disabled={!canWrite} onClick={() => setPaying(c)}>
                            Encaisser
                          </Button>
                        ) : null,
                    },
                  ]}
                />
              </Card>
              <Note>Prélèvement automatique sur les gains, pénalités de retard, reprise du véhicule et transfert de la carte grise en fin de contrat : à valider avec WAMI-CO.</Note>
            </>
          );
        }}
      </ResourceView>
      {paying ? (
        <PaymentDialog
          contract={paying}
          onClose={() => setPaying(null)}
          onDone={(c) => {
            contracts.mutate((l) => l.map((x) => (x.id === c.id ? c : x)));
            setPaying(null);
          }}
        />
      ) : null}
    </>
  );
}

function PaymentDialog({ contract, onClose, onDone }: { contract: LeaseContract; onClose: () => void; onDone: (c: LeaseContract) => void }) {
  const [amount, setAmount] = useState(String(contract.weeklyInstallment));
  const [method, setMethod] = useState<LeasePayment["method"]>("momo");
  const { busy, run } = useAction();
  return (
    <Dialog
      open
      title={`Versement · ${contract.driverName}`}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button
            tone="primary"
            busy={busy}
            onClick={async () => {
              const r = await run(() => contractsUseCases.recordPayment(contract, Number(amount), method), "Versement enregistré.");
              if (r) onDone(r);
            }}
          >
            Enregistrer
          </Button>
        </>
      }
    >
      <Field label="Montant (F)" hint={`Reste à payer : ${fcfa(remaining(contract))}`}>
        <input className={fieldClass} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} />
      </Field>
      <Field label="Moyen">
        <select className={fieldClass} value={method} onChange={(e) => setMethod(e.target.value as LeasePayment["method"])}>
          <option value="momo">Mobile Money</option>
          <option value="cash">Espèces (agence)</option>
          <option value="earnings">Retenue sur les gains</option>
        </select>
      </Field>
    </Dialog>
  );
}
