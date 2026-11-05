"use client";

import { useAction } from "@/shared/hooks/use-action";
import { useResource } from "@/shared/hooks/use-resource";
import { dateTime, fcfa } from "@/shared/lib/format";
import { useCanWrite } from "@/shared/ui/app-shell";
import { DataTable } from "@/shared/ui/data-table";
import { Button, Card, CardHeader, Note, PageHeader, Tag, type Tone } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { scheduledRidesUseCases } from "../application/scheduled-rides.use-cases";
import { kmLabel, rankCandidates, urgency, type Candidate, type ScheduledRide, type Urgency } from "../domain/scheduled-ride";

const TONE: Record<Urgency, Tone> = { critical: "bad", soon: "warn", ok: "neutral" };

export function ScheduledRidesView() {
  const data = useResource(() => scheduledRidesUseCases.list(), "scheduled");
  const canWrite = useCanWrite("scheduled-rides");
  const { busy, run } = useAction();

  return (
    <>
      <PageHeader title="Courses programmées à affecter" />
      <ResourceView state={data} onRetry={data.reload}>
        {(d) =>
          d.rides.length === 0 ? (
            <Card className="p-6 text-center text-sm text-muted">Aucune course programmée en attente d’affectation manuelle.</Card>
          ) : (
            <>
              {d.rides.map((r) => (
                <Card key={r.id} className="overflow-hidden">
                  <CardHeader title={`${r.number} · ${r.from} → ${r.to}`}>
                    <span className="flex items-center gap-2 text-xs">
                      <Tag tone={TONE[urgency(r, d.thresholdMinutes)]}>départ dans {r.minutesLeft} min</Tag>
                      {dateTime(r.scheduledAt)} · {r.vehicleType} · {fcfa(r.price)}
                      {r.guarantee !== null ? ` · garantie ${fcfa(r.guarantee)}` : ""}
                    </span>
                  </CardHeader>
                  <DataTable<Candidate>
                    rows={rankCandidates(r.candidates)}
                    rowKey={(c) => c.driverId}
                    empty="Aucun chauffeur candidat."
                    columns={[
                      { key: "n", header: "Chauffeur", render: (c) => <span className="flex flex-col"><b>{c.name}</b><span className="text-xs text-muted">{c.phone}</span></span> },
                      { key: "v", header: "Véhicule", render: (c) => c.vehicle },
                      { key: "r", header: "Note", align: "right", render: (c) => `${c.rating.toFixed(1).replace(".", ",")} (${c.totalRides})` },
                      { key: "d", header: "Distance", align: "right", render: (c) => kmLabel(c.distanceM) },
                      { key: "o", header: "", render: (c) => (c.online ? <Tag tone="ok">En ligne</Tag> : <Tag>Hors ligne</Tag>) },
                      { key: "a", header: "", render: (c) => <AssignButton ride={r} candidate={c} disabled={!canWrite || busy} run={run} onDone={data.reload} /> },
                    ]}
                  />
                </Card>
              ))}
              <Note>Courses sous le seuil de {d.thresholdMinutes} min avant le départ, sans chauffeur confirmé. L’affectation prévient le chauffeur et le client.</Note>
            </>
          )
        }
      </ResourceView>
    </>
  );
}

function AssignButton({ ride, candidate, disabled, run, onDone }: { ride: ScheduledRide; candidate: Candidate; disabled: boolean; run: ReturnType<typeof useAction>["run"]; onDone: () => void }) {
  return (
    <Button
      size="sm"
      tone="primary"
      disabled={disabled}
      onClick={async () => {
        const r = await run(() => scheduledRidesUseCases.assign(ride, candidate), `${candidate.name} est affecté(e) à ${ride.number}.`);
        if (r !== undefined) onDone();
      }}
    >
      Affecter
    </Button>
  );
}
