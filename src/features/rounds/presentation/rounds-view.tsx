"use client";

import { useState } from "react";
import { useAction } from "@/shared/hooks/use-action";
import { useResource } from "@/shared/hooks/use-resource";
import { useCanWrite } from "@/shared/ui/app-shell";
import { Button, Card, Field, fieldClass, PageHeader, Tag } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { roundsUseCases } from "../application/rounds.use-cases";
import { VEHICLE_CLASS_LABELS, assignBlocker, progress, type Courier, type Round } from "../domain/round";

export function RoundsView() {
  const rounds = useResource(() => roundsUseCases.list(), "rounds");
  const couriers = useResource(() => roundsUseCases.couriers(), "couriers");

  return (
    <>
      <PageHeader title="Tournées de livraison" />
      <ResourceView state={rounds} onRetry={rounds.reload}>
        {(list) => (
          <div className="grid gap-3.5 lg:grid-cols-2 2xl:grid-cols-3">
            {list.map((r) => (
              <RoundCard
                key={r.id}
                round={r}
                couriers={couriers.data ?? []}
                onChange={(u) => {
                  rounds.mutate((l) => l.map((x) => (x.id === u.id ? u : x)));
                  couriers.reload();
                }}
              />
            ))}
          </div>
        )}
      </ResourceView>
    </>
  );
}

function RoundCard({ round, couriers, onChange }: { round: Round; couriers: Courier[]; onChange: (r: Round) => void }) {
  const { busy, run } = useAction();
  const canWrite = useCanWrite("rounds");
  const [courierId, setCourierId] = useState("");
  const { done, total } = progress(round);
  const courier = couriers.find((c) => c.id === courierId);
  const blocker = courier ? assignBlocker(round, courier) : null;

  return (
    <Card className="flex flex-col gap-2.5 px-4 py-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex flex-col">
          <b className="text-sm">{round.name}</b>
          <span className="text-xs text-muted">
            {round.accountName} · {round.parcels} colis · {VEHICLE_CLASS_LABELS[round.requiredVehicle]} minimum
          </span>
        </span>
        <Tag tone={round.status === "done" ? "ok" : round.status === "inProgress" ? "info" : "neutral"}>
          {round.status === "done" ? "Terminée" : round.status === "inProgress" ? "En cours" : "Planifiée"}
        </Tag>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-field" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label="Arrêts effectués">
        <span className="block h-full bg-brand" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
      </div>
      <span className="text-xs text-muted">
        {done}/{total} arrêts · livreur : {round.courierName ?? "non affecté"}
      </span>
      <ol className="flex flex-col gap-1 text-[12.5px]">
        {round.stops.map((s, i) => (
          <li key={s.id} className="flex items-center justify-between gap-2">
            <span>
              {i + 1}. {s.address} · {s.recipient}
            </span>
            <Tag tone={s.status === "done" ? "ok" : s.status === "failed" ? "bad" : "neutral"}>{s.status === "done" ? "Livré" : s.status === "failed" ? "Échec" : "À faire"}</Tag>
          </li>
        ))}
      </ol>
      {round.status === "planned" ? (
        <div className="flex items-end gap-2">
          <Field label="Affecter à">
            <select className={fieldClass} value={courierId} onChange={(e) => setCourierId(e.target.value)}>
              <option value="">Choisir un livreur…</option>
              {couriers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {VEHICLE_CLASS_LABELS[c.vehicle]} {c.online ? "" : "(hors ligne)"} {c.busy ? "(occupé)" : ""}
                </option>
              ))}
            </select>
          </Field>
          <Button
            tone="primary"
            busy={busy}
            disabled={!canWrite || !courier || Boolean(blocker)}
            onClick={async () => {
              if (!courier) return;
              const r = await run(() => roundsUseCases.assign(round, courier), "Tournée affectée.");
              if (r) onChange(r);
            }}
          >
            Affecter
          </Button>
        </div>
      ) : null}
      {blocker ? <span className="text-xs text-bad">{blocker}</span> : null}
    </Card>
  );
}
