"use client";

import { useState } from "react";
import { useAction } from "@/shared/hooks/use-action";
import { useResource } from "@/shared/hooks/use-resource";
import { dayMonth, percent } from "@/shared/lib/format";
import { useCanWrite } from "@/shared/ui/app-shell";
import { DataTable } from "@/shared/ui/data-table";
import { Dialog } from "@/shared/ui/dialog";
import { Button, Card, Field, fieldClass, InfoRow, PageHeader, Tag } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { driversUseCases } from "../application/drivers.use-cases";
import { DRIVER_STATUS_LABELS, riskFlags, type Driver } from "../domain/driver";

export function DriversView() {
  const [q, setQ] = useState("");
  const drivers = useResource(() => driversUseCases.list(q), q);
  const [selected, setSelected] = useState<Driver | null>(null);

  return (
    <>
      <PageHeader title="Chauffeurs et livreurs">
        <label className="ml-auto w-72">
          <span className="sr-only">Rechercher un partenaire</span>
          <input className={fieldClass} placeholder="Nom, téléphone, plaque…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </PageHeader>
      <div className="grid gap-3.5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="overflow-hidden">
          <ResourceView state={drivers} onRetry={drivers.reload}>
            {(list) => (
              <DataTable<Driver>
                rows={list}
                rowKey={(d) => d.id}
                selectedKey={selected?.id}
                onSelect={setSelected}
                columns={[
                  { key: "name", header: "Partenaire", render: (d) => d.name },
                  { key: "act", header: "Activité", render: (d) => d.activities.map((a) => (a === "driver" ? "Chauffeur" : "Livreur")).join(" + ") },
                  { key: "vehicle", header: "Véhicule", render: (d) => d.vehicle },
                  {
                    key: "status",
                    header: "Statut",
                    render: (d) => (
                      <span className="flex gap-1">
                        <Tag tone={d.status === "active" ? "ok" : "bad"}>{DRIVER_STATUS_LABELS[d.status]}</Tag>
                        {d.online ? <Tag tone="info">En ligne</Tag> : null}
                      </span>
                    ),
                  },
                  { key: "rating", header: "Note", align: "right", render: (d) => d.rating.toFixed(1).replace(".", ",") },
                  { key: "acc", header: "Acceptation", align: "right", render: (d) => percent(d.acceptanceRate) },
                  { key: "missions", header: "Missions", align: "right", render: (d) => d.missionsTotal.toLocaleString("fr-FR") },
                  { key: "flags", header: "Alertes", render: (d) => riskFlags(d).join(" · ") || "—" },
                ]}
              />
            )}
          </ResourceView>
        </Card>
        {selected ? (
          <DriverPanel
            key={selected.id}
            driver={selected}
            onChange={(d) => {
              setSelected(d);
              drivers.mutate((l) => l.map((x) => (x.id === d.id ? d : x)));
            }}
          />
        ) : (
          <Card className="flex items-center justify-center p-6 text-sm text-muted">Sélectionnez un partenaire.</Card>
        )}
      </div>
    </>
  );
}

function DriverPanel({ driver, onChange }: { driver: Driver; onChange: (d: Driver) => void }) {
  const { busy, run } = useAction();
  const canWrite = useCanWrite("drivers");
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  return (
    <Card className="flex flex-col gap-1 px-4 py-3.5">
      <b className="text-[15px]">{driver.name}</b>
      <InfoRow label="Téléphone">{driver.phone}</InfoRow>
      <InfoRow label="Véhicule">{driver.vehicle}</InfoRow>
      <InfoRow label="Partenaire depuis">{dayMonth(driver.joinedAt)}</InfoRow>
      <InfoRow label="Statut">{DRIVER_STATUS_LABELS[driver.status]}</InfoRow>
      {driver.suspensionReason ? <InfoRow label="Motif">{driver.suspensionReason}</InfoRow> : null}
      <InfoRow label="Pièces bientôt expirées">{String(driver.documentsExpiringSoon)}</InfoRow>
      {driver.status === "active" ? (
        <Button className="mt-2" tone="danger" disabled={!canWrite} onClick={() => setOpen(true)}>
          Suspendre…
        </Button>
      ) : (
        <Button
          className="mt-2"
          tone="primary"
          disabled={!canWrite}
          busy={busy}
          onClick={async () => {
            const r = await run(() => driversUseCases.setStatus(driver, "active", ""), "Compte réactivé.");
            if (r) onChange(r);
          }}
        >
          Réactiver
        </Button>
      )}
      <Dialog
        open={open}
        title={`Suspendre ${driver.name}`}
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button onClick={() => setOpen(false)}>Annuler</Button>
            <Button
              tone="danger"
              busy={busy}
              onClick={async () => {
                const r = await run(() => driversUseCases.setStatus(driver, "suspended", reason), "Partenaire suspendu : il ne reçoit plus d’offres.");
                if (r) {
                  onChange(r);
                  setOpen(false);
                }
              }}
            >
              Suspendre
            </Button>
          </>
        }
      >
        <Field label="Motif" hint="Communiqué au partenaire et tracé dans le journal.">
          <textarea className={`${fieldClass} h-20 py-2`} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
      </Dialog>
    </Card>
  );
}
