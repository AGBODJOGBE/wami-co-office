"use client";

import { useState } from "react";
import { useResource } from "@/shared/hooks/use-resource";
import { DataTable } from "@/shared/ui/data-table";
import { Card, Field, fieldClass, Note } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { connectionUseCases } from "../application/connection-time.use-cases";
import { avgHoursPerDay, ranked, type DriverConnectionReport } from "../domain/connection-time";
import { hoursLabel } from "../domain/driver-ops";

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Rapport de flotte : temps passé en ligne par chauffeur sur une période. */
export function ConnectionTimePanel() {
  const [from, setFrom] = useState(() => iso(new Date(Date.now() - 6 * 86_400_000)));
  const [to, setTo] = useState(() => iso(new Date()));
  const report = useResource(() => connectionUseCases.report(from, to), `${from}|${to}`);
  return (
    <>
      <div className="flex gap-3">
        <Field label="Du">
          <input className={fieldClass} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label="Au">
          <input className={fieldClass} type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </Field>
      </div>
      <Card className="overflow-hidden">
        <ResourceView state={report} onRetry={report.reload}>
          {(r) => (
            <DataTable<DriverConnectionReport>
              rows={ranked(r.drivers)}
              rowKey={(d) => d.driverId}
              empty="Aucune connexion sur cette période."
              columns={[
                { key: "d", header: "Chauffeur", render: (d) => <code className="text-xs">{d.driverId}</code> },
                { key: "j", header: "Jours connectés", align: "right", render: (d) => String(d.days.length) },
                { key: "m", header: "Moyenne par jour", align: "right", render: (d) => `${avgHoursPerDay(d).toFixed(1).replace(".", ",")} h` },
                { key: "t", header: "Total", align: "right", render: (d) => <b>{hoursLabel(d.totalSeconds)}</b> },
              ]}
            />
          )}
        </ResourceView>
      </Card>
      <Note>Temps cumulé des sessions de connexion, jour par jour. Le seuil d’activité minimum attendu d’un chauffeur : à valider.</Note>
    </>
  );
}
