"use client";

import { useState } from "react";
import { useResource } from "@/shared/hooks/use-resource";
import { dateTime, fcfa } from "@/shared/lib/format";
import { DataTable } from "@/shared/ui/data-table";
import { Dialog } from "@/shared/ui/dialog";
import { Button, InfoRow, Note, Segmented } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { rideDetailUseCases } from "../application/ride-detail.use-cases";
import { unavailableLabel, type KeyValue, type MatchingView, type Section } from "../domain/ride-detail";
import type { Ride } from "../domain/ride";

const TABS = [["matching", "Matching"], ["telemetry", "Télémétrie"], ["track", "Trace GPS"], ["settlement", "Garantie"]] as const;
type Tab = (typeof TABS)[number][0];

export function RideDetailDialog({ ride, onClose }: { ride: Ride; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("matching");
  const detail = useResource(() => rideDetailUseCases.detail(ride.id), ride.id);
  const settlement = useResource(() => rideDetailUseCases.settlement(ride.id), `s-${ride.id}`);

  return (
    <Dialog open title={`Course ${ride.number}`} onClose={onClose} footer={<Button onClick={onClose}>Fermer</Button>}>
      <Segmented label="Section" options={TABS} value={tab} onChange={setTab} />
      {tab === "settlement" ? (
        <ResourceView state={settlement} onRetry={settlement.reload}>
          {(s) =>
            s === null ? (
              <Note>Cette course n’a pas de garantie (course immédiate).</Note>
            ) : (
              <>
                {s.facts.map((f) => (
                  <InfoRow key={f.key} label={f.key}>
                    {f.value}
                  </InfoRow>
                ))}
                <DataTable
                  rows={s.movements}
                  rowKey={(m) => m.id}
                  empty="Aucun mouvement."
                  columns={[
                    { key: "d", header: "Date", render: (m) => dateTime(m.at) },
                    { key: "l", header: "Mouvement", render: (m) => <span className="whitespace-normal">{m.label}{m.isMarker ? " (repère)" : ""}</span> },
                    { key: "a", header: "Montant", align: "right", render: (m) => fcfa(m.direction === "DEBIT" ? -m.amount : m.amount, { signed: true }) },
                  ]}
                />
              </>
            )
          }
        </ResourceView>
      ) : (
        <ResourceView state={detail} onRetry={detail.reload}>
          {(d) => (
            <>
              {tab === "matching" ? <Guarded section={d.matching}>{(m) => <Matching m={m} />}</Guarded> : null}
              {tab === "telemetry" ? <Guarded section={d.telemetry}>{(t) => <Facts rows={t.facts} />}</Guarded> : null}
              {tab === "track" ? (
                <Guarded section={d.track}>
                  {(t) => (
                    <>
                      <InfoRow label="Points enregistrés">{`${t.pointCount} (échantillon : ${t.sampledCount})`}</InfoRow>
                      {t.truncated ? <Note>Trace tronquée : points écartés au-delà de la limite.</Note> : null}
                      <DataTable
                        rows={t.segments}
                        rowKey={(s) => s.from}
                        empty="Aucun segment."
                        columns={[
                          { key: "s", header: "Étape", render: (s) => s.status },
                          { key: "f", header: "De", render: (s) => dateTime(s.from) },
                          { key: "t", header: "À", render: (s) => dateTime(s.to) },
                          { key: "p", header: "Points", align: "right", render: (s) => String(s.points) },
                        ]}
                      />
                    </>
                  )}
                </Guarded>
              ) : null}
            </>
          )}
        </ResourceView>
      )}
    </Dialog>
  );
}

function Guarded<T>({ section, children }: { section: Section<T>; children: (data: T) => React.ReactNode }) {
  if (!section.available) return <Note>{unavailableLabel(section.reason)}</Note>;
  return <>{children(section)}</>;
}

function Facts({ rows }: { rows: KeyValue[] }) {
  if (rows.length === 0) return <Note>Aucune donnée.</Note>;
  return (
    <div className="flex flex-col">
      {rows.map((f) => (
        <InfoRow key={f.key} label={f.key}>
          {f.value}
        </InfoRow>
      ))}
    </div>
  );
}

function Matching({ m }: { m: MatchingView }) {
  return (
    <>
      <Facts rows={m.facts} />
      <DataTable
        rows={m.cycles}
        rowKey={(c) => c.at}
        empty="Aucun cycle de recherche."
        columns={[
          { key: "a", header: "Quand", render: (c) => dateTime(c.at) },
          { key: "t", header: "Déclencheur", render: (c) => c.trigger },
          { key: "v", header: "Véhicule", render: (c) => c.vehicleType },
          { key: "r", header: "Rayons (éligibles)", render: (c) => c.radii },
          { key: "o", header: "Résultat", render: (c) => c.outcome },
        ]}
      />
      {m.milestones.length > 0 ? <Facts rows={m.milestones.map((x) => ({ key: dateTime(x.at), value: `${x.code}${x.detail ? ` · ${x.detail}` : ""}` }))} /> : null}
    </>
  );
}
