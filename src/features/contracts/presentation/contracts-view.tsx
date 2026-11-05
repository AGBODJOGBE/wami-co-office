"use client";

import { useState } from "react";
import { useAction } from "@/shared/hooks/use-action";
import { useResource } from "@/shared/hooks/use-resource";
import { dayMonth, fcfa } from "@/shared/lib/format";
import { useCanWrite } from "@/shared/ui/app-shell";
import { DataTable } from "@/shared/ui/data-table";
import { Dialog } from "@/shared/ui/dialog";
import { Button, Card, Field, fieldClass, InfoRow, Kpi, Note, PageHeader, Tag, type Tone } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { ContractMonitoring, FleetKpisRow, RepaymentPanel } from "./contract-ops-panels";
import { contractsUseCases } from "../application/contracts.use-cases";
import { LEASE_FREQUENCY_LABELS, LEASE_HEALTH_LABELS, LEASE_STATUS_LABELS, arrears, health, paidAmount, remaining, type LeaseContract, type LeaseHealth, type LeaseInstallment, type PaymentMethod } from "../domain/lease-contract";

const HEALTH_TONE: Record<LeaseHealth, Tone> = { settled: "ok", upToDate: "info", late: "warn", critical: "bad" };
const INSTALLMENT_LABEL: Record<LeaseInstallment["status"], string> = { pending: "À venir", paid: "Payée", unpaid: "Impayée", partial: "Partielle", cancelled: "Annulée", recovering: "En recouvrement" };

export function ContractsView() {
  const contracts = useResource(() => contractsUseCases.list(), "contracts");
  const [paying, setPaying] = useState<LeaseContract | null>(null);
  const [detail, setDetail] = useState<LeaseContract | null>(null);
  const canWrite = useCanWrite("contracts");

  return (
    <>
      <PageHeader title="Contrats de location-vente (WAMI-CO)" />
      <FleetKpisRow />
      <ResourceView state={contracts} onRetry={contracts.reload}>
        {(list) => {
          const active = list.filter((c) => c.status === "active");
          const totalArrears = active.reduce((s, c) => s + arrears(c), 0);
          return (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Kpi label="Contrats actifs" value={String(active.length)} />
                <Kpi label="Encaissé" value={fcfa(list.reduce((s, c) => s + paidAmount(c), 0))} />
                <Kpi label="Reste à encaisser" value={fcfa(active.reduce((s, c) => s + remaining(c), 0))} />
                <Kpi label="Impayés à date" value={fcfa(totalArrears)} hint={`${active.filter((c) => arrears(c) > 0).length} contrats en retard`} />
              </div>
              <Card className="overflow-hidden">
                <DataTable<LeaseContract>
                  rows={list}
                  rowKey={(c) => c.id}
                  columns={[
                    { key: "driver", header: "Chauffeur", render: (c) => <b>{c.driverName}</b> },
                    { key: "veh", header: "Véhicule", render: (c) => `${c.vehicleLabel} · ${c.plate}` },
                    { key: "start", header: "Début", render: (c) => dayMonth(c.startDate) },
                    { key: "freq", header: "Rythme", render: (c) => LEASE_FREQUENCY_LABELS[c.frequency] },
                    { key: "weekly", header: "Échéance", align: "right", render: (c) => `${fcfa(c.installmentAmount)} × ${c.installmentCount}` },
                    { key: "paid", header: "Payé", align: "right", render: (c) => fcfa(paidAmount(c)) },
                    { key: "rest", header: "Reste", align: "right", render: (c) => fcfa(remaining(c)) },
                    { key: "arrears", header: "Impayé", align: "right", render: (c) => (arrears(c) ? <b className="text-bad">{fcfa(arrears(c))}</b> : "—") },
                    { key: "health", header: "État", render: (c) => (c.status === "active" ? <Tag tone={HEALTH_TONE[health(c)]}>{LEASE_HEALTH_LABELS[health(c)]}</Tag> : <Tag tone={c.status === "completed" ? "ok" : "bad"}>{LEASE_STATUS_LABELS[c.status]}</Tag>) },
                    {
                      key: "act",
                      header: "",
                      render: (c) => (
                        <span className="flex gap-1.5">
                          <Button size="sm" onClick={() => setDetail(c)}>
                            Détail
                          </Button>
                          {c.status === "active" && remaining(c) > 0 ? (
                            <Button size="sm" disabled={!canWrite} onClick={() => setPaying(c)}>
                              Encaisser
                            </Button>
                          ) : null}
                        </span>
                      ),
                    },
                  ]}
                />
              </Card>
              <ContractMonitoring />
      <Note>Le prélèvement des échéances sur les gains est automatique (côté backend). Pénalités, reprise du véhicule et transfert de la carte grise : à valider avec WAMI-CO.</Note>
            </>
          );
        }}
      </ResourceView>
      {detail ? (
        <DetailDialog
          contract={detail}
          canWrite={canWrite}
          onClose={() => setDetail(null)}
          onChanged={() => {
            setDetail(null);
            contracts.reload();
          }}
        />
      ) : null}
      {paying ? (
        <PaymentDialog
          contract={paying}
          onClose={() => setPaying(null)}
          onDone={() => {
            setPaying(null);
            contracts.reload();
          }}
        />
      ) : null}
    </>
  );
}

function PaymentDialog({ contract, onClose, onDone }: { contract: LeaseContract; onClose: () => void; onDone: () => void }) {
  const [amount, setAmount] = useState(String(contract.installmentAmount));
  const [method, setMethod] = useState<PaymentMethod>("momo");
  const [reference, setReference] = useState("");
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
              const r = await run(() => contractsUseCases.recordPayment(contract, Number(amount), method, reference), "Versement enregistré.");
              if (r !== undefined) onDone();
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
        <select className={fieldClass} value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
          <option value="momo">Mobile Money</option>
          <option value="cash">Espèces (agence)</option>
        </select>
      </Field>
      <Field label="Référence" hint="Numéro de reçu ou de transaction.">
        <input className={fieldClass} value={reference} onChange={(e) => setReference(e.target.value)} />
      </Field>
    </Dialog>
  );
}

function DetailDialog({ contract, canWrite, onClose, onChanged }: { contract: LeaseContract; canWrite: boolean; onClose: () => void; onChanged: () => void }) {
  const items = useResource(() => contractsUseCases.installments(contract.id), contract.id);
  const [reason, setReason] = useState("");
  const { busy, run } = useAction();
  const act = async (call: () => ReturnType<typeof contractsUseCases.resume>, done: string) => {
    const r = await run(call, done);
    if (r !== undefined) onChanged();
  };
  return (
    <Dialog open title={`Contrat · ${contract.driverName}`} onClose={onClose} footer={<Button onClick={onClose}>Fermer</Button>}>
      <div className="flex flex-col gap-1">
        <InfoRow label="Statut">{LEASE_STATUS_LABELS[contract.status]}</InfoRow>
        <InfoRow label="Période">{`${dayMonth(contract.startDate)} → ${dayMonth(contract.endDate)}`}</InfoRow>
        <InfoRow label="Total à rembourser">{fcfa(contract.totalAmount)}</InfoRow>
        <InfoRow label="Apport">{fcfa(contract.downPayment)}</InfoRow>
        <InfoRow label="Mode">{contract.repaymentMode === "revenueShare" ? "Prélèvement sur les revenus" : "Échéancier"}</InfoRow>
      </div>
      <ResourceView state={items} onRetry={items.reload}>
        {(rows) => (
          <DataTable<LeaseInstallment>
            rows={rows}
            rowKey={(i) => i.id}
            empty="Pas d’échéancier (prélèvement sur les revenus)."
            columns={[
              { key: "n", header: "N°", render: (i) => i.number },
              { key: "due", header: "Échéance", render: (i) => dayMonth(i.dueDate) },
              { key: "amount", header: "Montant", align: "right", render: (i) => fcfa(i.amount) },
              { key: "paid", header: "Payé", align: "right", render: (i) => fcfa(i.paid) },
              { key: "st", header: "État", render: (i) => <Tag tone={i.status === "paid" ? "ok" : i.status === "unpaid" ? "bad" : "neutral"}>{INSTALLMENT_LABEL[i.status]}</Tag> },
            ]}
          />
        )}
      </ResourceView>
      <RepaymentPanel contract={contract} threshold={3} onChanged={onChanged} />
      {contract.status === "active" || contract.status === "suspended" ? (
        <div className="mt-2 flex flex-col gap-2">
          <Field label="Motif (obligatoire pour une rupture)">
            <input className={fieldClass} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
          <div className="flex gap-2">
            {contract.status === "active" ? (
              <Button disabled={!canWrite} busy={busy} onClick={() => act(() => contractsUseCases.suspend(contract, reason), "Contrat suspendu.")}>
                Suspendre
              </Button>
            ) : (
              <Button disabled={!canWrite} busy={busy} onClick={() => act(() => contractsUseCases.resume(contract), "Contrat repris.")}>
                Reprendre
              </Button>
            )}
            <Button tone="danger" disabled={!canWrite} busy={busy} onClick={() => act(() => contractsUseCases.breakContract(contract, reason), "Contrat rompu.")}>
              Rompre le contrat
            </Button>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}
