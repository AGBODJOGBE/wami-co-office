"use client";

import { useState } from "react";
import { useAction } from "@/shared/hooks/use-action";
import { useResource } from "@/shared/hooks/use-resource";
import { dayMonth } from "@/shared/lib/format";
import { useCanWrite } from "@/shared/ui/app-shell";
import { DataTable } from "@/shared/ui/data-table";
import { Dialog } from "@/shared/ui/dialog";
import { Button, Card, Field, fieldClass, PageHeader, Segmented, Tag } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { vehiclesUseCases } from "../application/vehicles.use-cases";
import { VEHICLE_KIND_LABELS, expiryState, type ExpiryState, type Vehicle } from "../domain/vehicle";

const EXPIRY: Record<ExpiryState, ["ok" | "warn" | "bad", string]> = { ok: ["ok", "OK"], soon: ["warn", "Bientôt"], expired: ["bad", "Expirée"] };

export function VehiclesView() {
  const vehicles = useResource(() => vehiclesUseCases.list(), "vehicles");
  const [owner, setOwner] = useState<"all" | Vehicle["owner"]>("all");
  const [assigning, setAssigning] = useState<Vehicle | null>(null);
  const canWrite = useCanWrite("vehicles");
  const [now] = useState(() => new Date());

  return (
    <>
      <PageHeader title="Véhicules">
        <Segmented
          label="Propriétaire"
          value={owner}
          onChange={setOwner}
          options={[
            ["all", "Tous"],
            ["wamiCo", "Flotte WAMI-CO"],
            ["partner", "Partenaires"],
          ]}
        />
      </PageHeader>
      <Card className="overflow-hidden">
        <ResourceView state={vehicles} onRetry={vehicles.reload}>
          {(list) => (
            <DataTable<Vehicle>
              rows={list.filter((v) => owner === "all" || v.owner === owner)}
              rowKey={(v) => v.id}
              columns={[
                { key: "plate", header: "Plaque", render: (v) => <b>{v.plate}</b> },
                { key: "kind", header: "Type", render: (v) => `${VEHICLE_KIND_LABELS[v.kind]} · ${v.model}` },
                { key: "owner", header: "Propriétaire", render: (v) => (v.owner === "wamiCo" ? "WAMI-CO" : "Partenaire") },
                { key: "driver", header: "Conducteur", render: (v) => v.driverName ?? <span className="text-muted">non affecté</span> },
                {
                  key: "ins",
                  header: "Assurance",
                  render: (v) => {
                    const [tone, label] = EXPIRY[expiryState(v.insuranceExpiresAt, now)];
                    return (
                      <span className="flex items-center gap-1.5">
                        <Tag tone={tone}>{label}</Tag> {dayMonth(v.insuranceExpiresAt)}
                      </span>
                    );
                  },
                },
                { key: "insp", header: "Visite technique", render: (v) => <Tag tone={EXPIRY[expiryState(v.inspectionExpiresAt, now)][0]}>{dayMonth(v.inspectionExpiresAt)}</Tag> },
                { key: "status", header: "État", render: (v) => <Tag tone={v.status === "maintenance" ? "warn" : v.status === "inService" ? "info" : "neutral"}>{v.status === "maintenance" ? "Maintenance" : v.status === "inService" ? "En service" : "Disponible"}</Tag> },
                {
                  key: "act",
                  header: "",
                  render: (v) =>
                    v.owner === "wamiCo" ? (
                      <Button size="sm" disabled={!canWrite} onClick={() => setAssigning(v)}>
                        Affecter
                      </Button>
                    ) : null,
                },
              ]}
            />
          )}
        </ResourceView>
      </Card>
      {assigning ? (
        <AssignDialog
          vehicle={assigning}
          onClose={() => setAssigning(null)}
          onDone={(v) => {
            vehicles.mutate((l) => l.map((x) => (x.id === v.id ? v : x)));
            setAssigning(null);
          }}
        />
      ) : null}
    </>
  );
}

function AssignDialog({ vehicle, onClose, onDone }: { vehicle: Vehicle; onClose: () => void; onDone: (v: Vehicle) => void }) {
  const drivers = useResource(() => vehiclesUseCases.assignableDrivers(), "assignable");
  const [driverId, setDriverId] = useState("");
  const { busy, run } = useAction();
  return (
    <Dialog
      open
      title={`Affecter ${vehicle.plate}`}
      onClose={onClose}
      footer={
        <>
          {vehicle.driverId ? (
            <Button
              tone="danger"
              busy={busy}
              onClick={async () => {
                const r = await run(() => vehiclesUseCases.assign(vehicle, null), "Véhicule retiré au conducteur.");
                if (r) onDone(r);
              }}
            >
              Retirer à {vehicle.driverName}
            </Button>
          ) : null}
          <Button onClick={onClose}>Annuler</Button>
          <Button
            tone="primary"
            busy={busy}
            disabled={!driverId}
            onClick={async () => {
              const r = await run(() => vehiclesUseCases.assign(vehicle, driverId), "Véhicule affecté.");
              if (r) onDone(r);
            }}
          >
            Affecter
          </Button>
        </>
      }
    >
      <Field label="Conducteur sans véhicule">
        <select className={fieldClass} value={driverId} onChange={(e) => setDriverId(e.target.value)}>
          <option value="">Choisir…</option>
          {(drivers.data ?? []).map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </Field>
    </Dialog>
  );
}
