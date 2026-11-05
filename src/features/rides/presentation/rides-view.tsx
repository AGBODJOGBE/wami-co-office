"use client";

import { useState } from "react";
import { useAction } from "@/shared/hooks/use-action";
import { useResource } from "@/shared/hooks/use-resource";
import { dateTime, fcfa, percent } from "@/shared/lib/format";
import { useCanWrite } from "@/shared/ui/app-shell";
import { DataTable } from "@/shared/ui/data-table";
import { Dialog } from "@/shared/ui/dialog";
import { Button, Card, Field, fieldClass, InfoRow, Kpi, PageHeader, Segmented, Tag } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { useRidesUi } from "../application/rides.store";
import { ridesUseCases } from "../application/rides.use-cases";
import { RIDE_CATEGORY_LABELS, totals, type Ride } from "../domain/ride";

const STATUS: Record<Ride["status"], [string, "info" | "ok" | "neutral"]> = {
  inProgress: ["En cours", "info"],
  completed: ["Terminée", "ok"],
  cancelled: ["Annulée", "neutral"],
};

export function RidesView() {
  const { status, q, setStatus, setQ } = useRidesUi();
  const rides = useResource(() => ridesUseCases.list({ status, q }), `${status}|${q}`);
  const [selected, setSelected] = useState<Ride | null>(null);

  return (
    <>
      <PageHeader title="Courses">
        <Segmented
          label="Statut"
          value={status}
          onChange={setStatus}
          options={[
            ["all", "Toutes"],
            ["inProgress", "En cours"],
            ["completed", "Terminées"],
            ["cancelled", "Annulées"],
          ]}
        />
        <label className="ml-auto w-64">
          <span className="sr-only">Filtrer</span>
          <input className={fieldClass} placeholder="N° de course, client, chauffeur…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </PageHeader>
      <ResourceView state={rides} onRetry={rides.reload}>
        {(list) => {
          const t = totals(list);
          return (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Kpi label="Courses terminées" value={String(t.count)} />
                <Kpi label="Chiffre d’affaires" value={fcfa(t.revenue)} />
                <Kpi label="Commission" value={fcfa(t.commission)} />
                <Kpi label="Taux d’annulation" value={percent(t.cancellationRate, 1)} />
              </div>
              <div className="grid gap-3.5 xl:grid-cols-[minmax(0,1fr)_340px]">
                <Card className="overflow-hidden">
                  <DataTable<Ride>
                    rows={list}
                    rowKey={(r) => r.id}
                    selectedKey={selected?.id}
                    onSelect={setSelected}
                    empty="Aucune course pour ce filtre."
                    columns={[
                      { key: "id", header: "Course", render: (r) => r.id },
                      { key: "cat", header: "Catégorie", render: (r) => RIDE_CATEGORY_LABELS[r.category] },
                      { key: "status", header: "Statut", render: (r) => <Tag tone={STATUS[r.status][1]}>{STATUS[r.status][0]}</Tag> },
                      { key: "route", header: "Trajet", render: (r) => `${r.from} → ${r.to}` },
                      { key: "driver", header: "Chauffeur", render: (r) => r.driverName ?? "—" },
                      { key: "price", header: "Prix", align: "right", render: (r) => fcfa(r.price + r.waitingFee) },
                      { key: "at", header: "Demandée", render: (r) => dateTime(r.requestedAt) },
                    ]}
                  />
                </Card>
                {selected ? (
                  <RidePanel
                    ride={selected}
                    onChange={(r) => {
                      setSelected(r);
                      rides.mutate((l) => l.map((x) => (x.id === r.id ? r : x)));
                    }}
                  />
                ) : (
                  <Card className="flex items-center justify-center p-6 text-sm text-muted">Sélectionnez une course.</Card>
                )}
              </div>
            </>
          );
        }}
      </ResourceView>
    </>
  );
}

function RidePanel({ ride, onChange }: { ride: Ride; onChange: (r: Ride) => void }) {
  const { busy, run } = useAction();
  const canWrite = useCanWrite("rides");
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  return (
    <Card className="flex flex-col gap-1 px-4 py-3.5">
      <div className="flex items-center justify-between">
        <b className="text-[15px]">{ride.id}</b>
        <Tag tone={STATUS[ride.status][1]}>{STATUS[ride.status][0]}</Tag>
      </div>
      <InfoRow label="Client">{ride.customerName}</InfoRow>
      <InfoRow label="Chauffeur">{ride.driverName ?? "—"}</InfoRow>
      <InfoRow label="Trajet">
        {ride.from} → {ride.to}
      </InfoRow>
      <InfoRow label="Distance, durée">
        {ride.distanceKm.toFixed(1).replace(".", ",")} km · {ride.durationMin} min
      </InfoRow>
      <InfoRow label="Prix">{fcfa(ride.price)}</InfoRow>
      <InfoRow label="Attente facturée">{fcfa(ride.waitingFee)}</InfoRow>
      <InfoRow label="Commission WAMI">{fcfa(ride.commission)}</InfoRow>
      <InfoRow label="Paiement">{ride.payment === "cash" ? "Espèces" : ride.payment === "momo" ? "Mobile Money" : "Portefeuille"}</InfoRow>
      {ride.cancelReason ? <InfoRow label="Motif d’annulation">{ride.cancelReason}</InfoRow> : null}
      <Button className="mt-2" tone="danger" disabled={!canWrite || ride.status !== "inProgress"} onClick={() => setOpen(true)}>
        Annuler la course
      </Button>
      <Dialog
        open={open}
        title={`Annuler ${ride.id}`}
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button onClick={() => setOpen(false)}>Retour</Button>
            <Button
              tone="danger"
              busy={busy}
              onClick={async () => {
                const r = await run(() => ridesUseCases.cancel(ride, reason), "Course annulée.");
                if (r) {
                  onChange(r);
                  setOpen(false);
                }
              }}
            >
              Confirmer
            </Button>
          </>
        }
      >
        <Field label="Motif">
          <input className={fieldClass} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
      </Dialog>
    </Card>
  );
}
