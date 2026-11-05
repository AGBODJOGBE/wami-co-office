"use client";

import { useState } from "react";
import { useAction } from "@/shared/hooks/use-action";
import { useResource } from "@/shared/hooks/use-resource";
import { dateTime, fcfa } from "@/shared/lib/format";
import { useCanWrite } from "@/shared/ui/app-shell";
import { DataTable } from "@/shared/ui/data-table";
import { Dialog } from "@/shared/ui/dialog";
import { Button, Card, Field, fieldClass, InfoRow, Kpi, PageHeader, Segmented, Tag, type Tone } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { b2cDeliveriesUseCases } from "../application/b2c-deliveries.use-cases";
import { B2C_STATUS_LABELS, FINAL_STATUSES, matchesFilter, totals, type B2cDelivery, type B2cFilter, type B2cStatus } from "../domain/b2c-delivery";

const FILTERS = [["active", "En cours"], ["problem", "À problème"], ["completed", "Livrées"], ["cancelled", "Annulées"], ["all", "Toutes"]] as const;
const TONE = (s: B2cStatus): Tone => (s === "completed" ? "ok" : s === "cancelled" ? "neutral" : s === "pickupFailed" || s === "deliveryFailed" || s === "returning" ? "bad" : "info");

export function B2cDeliveriesView() {
  const list = useResource(() => b2cDeliveriesUseCases.list(), "b2c");
  const [filter, setFilter] = useState<B2cFilter["status"]>("active");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<B2cDelivery | null>(null);

  return (
    <>
      <PageHeader title="Livraisons B2C">
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <input aria-label="Rechercher une livraison" className={`${fieldClass} w-60`} placeholder="N°, expéditeur, livreur…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Segmented label="Filtrer" options={FILTERS} value={filter} onChange={setFilter} />
        </div>
      </PageHeader>
      <ResourceView state={list} onRetry={list.reload}>
        {(all) => {
          const rows = all.filter((d) => matchesFilter(d, { status: filter, q }));
          const t = totals(all);
          return (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Kpi label="Livraisons" value={String(t.count)} />
                <Kpi label="À problème" value={String(t.problems)} />
                <Kpi label="Chiffre d’affaires (livrées)" value={fcfa(t.revenue)} />
                <Kpi label="Commission WAMI" value={fcfa(t.commission)} />
              </div>
              <Card className="overflow-hidden">
                <DataTable<B2cDelivery>
                  rows={rows}
                  rowKey={(d) => d.id}
                  empty="Aucune livraison."
                  columns={[
                    { key: "n", header: "N°", render: (d) => <b>{d.number}</b> },
                    { key: "d", header: "Créée le", render: (d) => dateTime(d.createdAt) },
                    { key: "s", header: "Expéditeur", render: (d) => d.sender },
                    { key: "l", header: "Livreur", render: (d) => d.driver ?? "—" },
                    { key: "t", header: "Trajet", render: (d) => <span className="whitespace-normal">{d.from} → {d.to}</span> },
                    { key: "p", header: "Prix", align: "right", render: (d) => fcfa(d.finalPrice ?? d.estimatedPrice) },
                    { key: "st", header: "Statut", render: (d) => <Tag tone={TONE(d.status)}>{B2C_STATUS_LABELS[d.status]}</Tag> },
                    { key: "a", header: "", render: (d) => <Button size="sm" onClick={() => setSelected(d)}>Détail</Button> },
                  ]}
                />
              </Card>
            </>
          );
        }}
      </ResourceView>
      {selected ? (
        <DetailDialog
          delivery={selected}
          onClose={() => setSelected(null)}
          onCancelled={() => {
            setSelected(null);
            list.reload();
          }}
        />
      ) : null}
    </>
  );
}

function DetailDialog({ delivery: d, onClose, onCancelled }: { delivery: B2cDelivery; onClose: () => void; onCancelled: () => void }) {
  const canWrite = useCanWrite("delivery-b2c");
  const { busy, run } = useAction();
  const [reason, setReason] = useState("");
  return (
    <Dialog open title={`Livraison ${d.number}`} onClose={onClose} footer={<Button onClick={onClose}>Fermer</Button>}>
      <InfoRow label="Statut">{B2C_STATUS_LABELS[d.status]}</InfoRow>
      <InfoRow label="Expéditeur">{`${d.sender}${d.senderPhone ? ` · ${d.senderPhone}` : ""}`}</InfoRow>
      <InfoRow label="Livreur">{d.driver ? `${d.driver}${d.driverPhone ? ` · ${d.driverPhone}` : ""}` : "—"}</InfoRow>
      <InfoRow label="Destinataire">{`${d.recipient} · ${d.recipientPhone}`}</InfoRow>
      <InfoRow label="Colis">{d.parcel}</InfoRow>
      <InfoRow label="Véhicule, paiement">{`${d.vehicleType} · ${d.payment}`}</InfoRow>
      <InfoRow label="Prix estimé">{fcfa(d.estimatedPrice)}</InfoRow>
      {d.finalPrice !== null ? <InfoRow label="Prix final">{fcfa(d.finalPrice)}</InfoRow> : null}
      {d.commission !== null ? <InfoRow label="Commission, gain livreur">{`${fcfa(d.commission)} · ${fcfa(d.driverPayout ?? 0)}`}</InfoRow> : null}
      {d.scheduledAt ? <InfoRow label="Programmée pour">{dateTime(d.scheduledAt)}</InfoRow> : null}
      {d.cancelReason ? <InfoRow label="Annulation">{`${d.cancelledBy ?? ""} · ${d.cancelReason}`}</InfoRow> : null}
      <div className="flex gap-3 text-xs">
        {d.pickupPhoto ? <a className="underline" href={d.pickupPhoto} target="_blank" rel="noreferrer">Photo de collecte</a> : null}
        {d.deliveryPhoto ? <a className="underline" href={d.deliveryPhoto} target="_blank" rel="noreferrer">Photo de remise</a> : null}
      </div>
      {!FINAL_STATUSES.includes(d.status) ? (
        <div className="mt-2 flex flex-col gap-2">
          <Field label="Motif d’annulation">
            <input className={fieldClass} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
          <Button
            tone="danger"
            disabled={!canWrite}
            busy={busy}
            onClick={async () => {
              const r = await run(() => b2cDeliveriesUseCases.cancel(d, reason), "Livraison annulée.");
              if (r !== undefined) onCancelled();
            }}
          >
            Annuler la livraison
          </Button>
        </div>
      ) : null}
    </Dialog>
  );
}
