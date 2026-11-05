"use client";

import Link from "next/link";
import { useResource } from "@/shared/hooks/use-resource";
import { fcfa, percent } from "@/shared/lib/format";
import { cn } from "@/shared/lib/cn";
import { DataTable } from "@/shared/ui/data-table";
import { Card, CardHeader, Kpi, KpiGrid, PageHeader, Tag } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { liveOpsUseCases } from "../application/live-ops.use-cases";
import type { Overview, ServiceStats } from "../domain/live-ops";

function Trend({ value }: { value: number }) {
  if (Math.abs(value) < 0.005) return <span className="text-muted">stable</span>;
  return <span className={cn("font-bold", value > 0 ? "text-ok" : "text-bad")}>{value > 0 ? "+" : "−"}{percent(Math.abs(value))}</span>;
}

/** Tableau de bord : chiffres du jour, détail par service, ce qui attend une action. */
export function DashboardView() {
  const overview = useResource(() => liveOpsUseCases.overview(), "overview");
  return (
    <>
      <PageHeader title="Tableau de bord">
        <span className="ml-auto text-xs text-muted">Aujourd’hui · données du backend WAMI ou fictives en démo</span>
      </PageHeader>
      <ResourceView state={overview} onRetry={overview.reload}>
        {(o) => <DashboardContent o={o} />}
      </ResourceView>
    </>
  );
}

function DashboardContent({ o }: { o: Overview }) {
  const max = Math.max(...o.hourly, 1);
  const peak = o.hourly.indexOf(max);
  return (
    <>
      <KpiGrid>
        <Kpi label="Volume d’affaires" value={fcfa(o.volume)} />
        <Kpi label="Commission WAMI" value={fcfa(o.commission)} hint={`${percent(o.commission / Math.max(o.volume, 1), 1)} du volume`} />
        <Kpi label="Missions terminées" value={o.completedMissions.toLocaleString("fr-FR")} />
        <Kpi label="Partenaires en ligne" value={String(o.onlinePartners)} hint={`sur ${o.activePartners} actifs`} />
        <Kpi label="Annulations" value={percent(o.cancellationRate, 1)} />
      </KpiGrid>
      <div className="grid gap-3.5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-3.5">
          <Card>
            <CardHeader title="Par service" />
            <DataTable<ServiceStats>
              rows={o.byService}
              rowKey={(s) => s.kind}
              columns={[
                { key: "label", header: "Service", render: (s) => s.label },
                { key: "missions", header: "Missions", align: "right", render: (s) => s.missions.toLocaleString("fr-FR") },
                { key: "volume", header: "Volume", align: "right", render: (s) => (s.volume ? fcfa(s.volume) : "—") },
                { key: "commission", header: "Commission", align: "right", render: (s) => (s.commission ? fcfa(s.commission) : "—") },
                { key: "trend", header: "Tendance", render: (s) => <Trend value={s.trend} /> },
              ]}
            />
          </Card>
          <Card className="flex flex-col gap-2 px-4 py-3.5">
            <div className="flex justify-between">
              <h2 className="text-sm font-bold">Missions par heure</h2>
              <span className="text-xs text-muted">Pic à {peak} h</span>
            </div>
            <div className="flex h-28 items-end gap-1" role="img" aria-label={`Missions par heure, pic à ${peak} heures`}>
              {o.hourly.map((v, h) => (
                <span key={h} className={cn("flex-1 rounded-t", h === peak ? "bg-brand" : "bg-line")} style={{ height: `${Math.max(4, (v / max) * 100)}%` }} />
              ))}
            </div>
            <div className="flex justify-between text-[10.5px] text-muted">
              <span>0 h</span>
              <span>12 h</span>
              <span>23 h</span>
            </div>
          </Card>
        </div>
        <Card>
          <CardHeader title="À traiter maintenant">{o.todo.some((t) => t.urgent) ? <Tag tone="bad">Urgent</Tag> : null}</CardHeader>
          <ul>
            {o.todo.map((t) => (
              <li key={t.id} className="border-t border-[#E3E6EB]">
                <Link href={t.href} className={cn("flex items-center justify-between gap-3 px-4 py-3 hover:bg-canvas", t.urgent && "bg-bad-soft hover:bg-bad-soft")}>
                  <span className="flex flex-col gap-0.5">
                    <b className="text-[13px]">{t.title}</b>
                    <span className="text-xs text-muted">{t.detail}</span>
                  </span>
                  <span aria-hidden="true" className="text-muted">
                    ›
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
