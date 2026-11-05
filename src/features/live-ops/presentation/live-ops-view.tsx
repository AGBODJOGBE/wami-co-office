"use client";

import { useEffect, useState } from "react";
import { useAction } from "@/shared/hooks/use-action";
import { useResource } from "@/shared/hooks/use-resource";
import { useCanWrite } from "@/shared/ui/app-shell";
import { DataTable } from "@/shared/ui/data-table";
import { Dialog } from "@/shared/ui/dialog";
import { WamiMap, type MapPoint } from "@/shared/ui/map/wami-map";
import { Button, Card, CardHeader, Chip, Field, fieldClass, InfoRow, Note, PageHeader, Tag, type Tone } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { ago, fcfa, hhmm } from "@/shared/lib/format";
import { liveOpsUseCases } from "../application/live-ops.use-cases";
import { useLiveOpsUi } from "../application/live-ops.store";
import {
  INCIDENT_LABELS,
  MISSION_STATUS_LABELS,
  SERVICE_LABELS,
  countByKind,
  isOpenAlert,
  type Incident,
  type Mission,
  type MissionStatus,
  type ServiceKind,
} from "../domain/live-ops";

const STATUS_TONE: Record<MissionStatus, Tone> = {
  sos: "bad",
  late: "warn",
  searching: "neutral",
  toPickup: "info",
  atPickup: "info",
  inProgress: "info",
  boarding: "ok",
};

const REFRESH_MS = 10_000;

export function LiveOpsView() {
  const missions = useResource(() => liveOpsUseCases.missions(), "missions");
  const incidents = useResource(() => liveOpsUseCases.incidents(), "incidents");
  const { kind, onlyProblems, selectedId, setKind, toggleProblems, select } = useLiveOpsUi();
  const { reload } = missions;

  // Rafraîchissement automatique (à remplacer par WebSocket côté backend : à valider).
  useEffect(() => {
    const t = setInterval(reload, REFRESH_MS);
    return () => clearInterval(t);
  }, [reload]);

  return (
    <>
      <PageHeader title="Opérations en direct">
        <span className="ml-auto text-xs text-muted">Actualisé toutes les 10 s</span>
      </PageHeader>
      <ResourceView state={missions} onRetry={missions.reload}>
        {(all) => {
          const counts = countByKind(all);
          const visible = all
            .filter((m) => kind === "all" || m.kind === kind)
            .filter((m) => !onlyProblems || m.status === "sos" || m.status === "late" || m.status === "searching");
          const selected = all.find((m) => m.id === selectedId) ?? null;
          const alert = all.find(isOpenAlert);
          return (
            <>
              <div className="flex flex-wrap gap-1.5">
                <Chip on={kind === "all"} onClick={() => setKind("all")}>
                  Tout · {all.length}
                </Chip>
                {(Object.keys(SERVICE_LABELS) as ServiceKind[]).map((k) => (
                  <Chip key={k} on={kind === k} onClick={() => setKind(k)}>
                    {SERVICE_LABELS[k]} · {counts[k]}
                  </Chip>
                ))}
                <span className="mx-1" />
                <Chip on={onlyProblems} onClick={toggleProblems}>
                  Problèmes seulement
                </Chip>
              </div>
              {alert ? <SosBanner mission={alert} onDone={(m) => missions.mutate((list) => list.map((x) => (x.id === m.id ? m : x)))} onOpen={() => select(alert.id)} /> : null}
              <div className="grid gap-3.5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_340px]">
                <Card className="overflow-hidden">
                  <DataTable<Mission>
                    rows={visible}
                    rowKey={(m) => m.id}
                    selectedKey={selectedId}
                    onSelect={(m) => select(m.id)}
                    empty="Aucune mission pour ce filtre."
                    columns={[
                      {
                        key: "id",
                        header: "Mission",
                        render: (m) => (
                          <span className="flex flex-col">
                            <span>{m.id}</span>
                            <span className="text-xs font-normal text-muted">{m.label}</span>
                          </span>
                        ),
                      },
                      {
                        key: "status",
                        header: "Statut",
                        render: (m) => (
                          <Tag tone={STATUS_TONE[m.status]}>
                            {MISSION_STATUS_LABELS[m.status]}
                            {m.status === "late" && m.delayMinutes ? ` ${m.delayMinutes} min` : ""}
                          </Tag>
                        ),
                      },
                      { key: "partner", header: "Partenaire", render: (m) => m.partnerName ?? <span className="text-muted">aucun · {ago(m.createdAt)}</span> },
                      { key: "eta", header: "ETA", align: "right", render: (m) => (m.etaMinutes === null ? "—" : `${m.etaMinutes} min`) },
                    ]}
                  />
                </Card>
                <Card className="relative h-[560px] overflow-hidden">
                  <WamiMap
                    points={visible.map(
                      (m): MapPoint => ({
                        id: m.id,
                        position: m.position,
                        color: m.status === "sos" ? "#C62828" : m.status === "late" ? "#E08A00" : m.partnerName ? "#5A82E6" : "#14213D",
                        label: `${m.id} · ${MISSION_STATUS_LABELS[m.status]}`,
                        emphasis: m.id === selectedId || m.status === "sos",
                      }),
                    )}
                    onPointClick={select}
                  />
                </Card>
                {selected ? (
                  <MissionPanel mission={selected} onChange={(m) => missions.mutate((list) => list.map((x) => (x.id === m.id ? m : x)))} />
                ) : (
                  <Card className="flex items-center justify-center p-6 text-center text-sm text-muted">Sélectionnez une mission dans la liste ou sur la carte.</Card>
                )}
              </div>
            </>
          );
        }}
      </ResourceView>
      <Card>
        <CardHeader title="Incidents ouverts" />
        <ResourceView state={incidents} onRetry={incidents.reload}>
          {(list) => <IncidentList incidents={list} onChange={(i) => incidents.mutate((l) => l.map((x) => (x.id === i.id ? i : x)))} />}
        </ResourceView>
      </Card>
    </>
  );
}

function SosBanner({ mission, onDone, onOpen }: { mission: Mission; onDone: (m: Mission) => void; onOpen: () => void }) {
  const { busy, run } = useAction();
  const canWrite = useCanWrite("live-ops");
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-bad-soft px-4 py-2.5 text-[13px]">
      <span>
        <b>SOS</b> sur {mission.id} · {mission.partnerName ?? "partenaire inconnu"} · {mission.pickup} → {mission.dropoff}
      </span>
      <span className="flex gap-2">
        <Button size="sm" onClick={onOpen}>
          Voir
        </Button>
        <Button
          size="sm"
          tone="primary"
          busy={busy}
          disabled={!canWrite}
          onClick={async () => {
            const m = await run(() => liveOpsUseCases.acknowledgeSos(mission), "SOS pris en charge.");
            if (m) onDone(m);
          }}
        >
          Prendre en charge
        </Button>
      </span>
    </div>
  );
}

function MissionPanel({ mission, onChange }: { mission: Mission; onChange: (m: Mission) => void }) {
  const { busy, run } = useAction();
  const canWrite = useCanWrite("live-ops");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");
  const m = mission;
  return (
    <Card className="flex flex-col gap-2.5 px-4 py-3.5">
      <div className="flex items-center justify-between">
        <b className="text-[15px]">{m.id}</b>
        <Tag tone={STATUS_TONE[m.status]}>{MISSION_STATUS_LABELS[m.status]}</Tag>
      </div>
      <span className="text-xs text-muted">
        {m.label} · {m.pickup} → {m.dropoff} · {fcfa(m.price)} · {m.payment === "cash" ? "espèces" : m.payment === "momo" ? "Mobile Money" : "portefeuille"}
      </span>
      <hr className="border-[#E3E6EB]" />
      <span className="text-[10.5px] font-bold uppercase tracking-wider text-muted">Déroulé</span>
      <ol>
        {m.timeline.map((s) => (
          <li key={s.at + s.label} className={s.alert ? "font-bold text-bad" : undefined}>
            <InfoRow label={s.label}>{hhmm(s.at)}</InfoRow>
          </li>
        ))}
      </ol>
      <hr className="border-[#E3E6EB]" />
      <InfoRow label="Partenaire">{m.partnerName ?? "—"}</InfoRow>
      <InfoRow label="Client">{m.customerName}</InfoRow>
      {m.sosAcknowledgedBy ? <InfoRow label="SOS pris en charge par">{m.sosAcknowledgedBy}</InfoRow> : null}
      <Button
        disabled={!canWrite}
        busy={busy}
        onClick={async () => {
          const r = await run(() => liveOpsUseCases.reassign(m), "Recherche d’un nouveau partenaire lancée.");
          if (r) onChange(r);
        }}
      >
        Réassigner un partenaire
      </Button>
      <Button tone="danger" disabled={!canWrite} onClick={() => setCancelOpen(true)}>
        Annuler et rembourser
      </Button>
      <Note>Appel masqué client/partenaire et procédure SOS (police, assistance) : à valider.</Note>
      <Dialog
        open={cancelOpen}
        title={`Annuler ${m.id}`}
        onClose={() => setCancelOpen(false)}
        footer={
          <>
            <Button onClick={() => setCancelOpen(false)}>Retour</Button>
            <Button
              tone="danger"
              busy={busy}
              onClick={async () => {
                const r = await run(() => liveOpsUseCases.cancel(m, reason), "Mission annulée, client remboursé.");
                if (r) {
                  onChange(r);
                  setCancelOpen(false);
                  setReason("");
                }
              }}
            >
              Confirmer l’annulation
            </Button>
          </>
        }
      >
        <Field label="Motif" hint="Visible dans le journal des actions.">
          <input className={fieldClass} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
      </Dialog>
    </Card>
  );
}

function IncidentList({ incidents, onChange }: { incidents: Incident[]; onChange: (i: Incident) => void }) {
  const { busy, run } = useAction();
  const canWrite = useCanWrite("live-ops");
  return (
    <DataTable<Incident>
      rows={incidents}
      rowKey={(i) => i.id}
      empty="Aucun incident."
      columns={[
        { key: "type", header: "Type", render: (i) => <Tag tone={i.type === "sos" || i.type === "accident" ? "bad" : "warn"}>{INCIDENT_LABELS[i.type]}</Tag> },
        { key: "mission", header: "Mission", render: (i) => i.missionId },
        { key: "summary", header: "Résumé", render: (i) => i.summary },
        { key: "opened", header: "Ouvert", render: (i) => ago(i.openedAt) },
        {
          key: "action",
          header: "",
          render: (i) =>
            i.status === "resolved" ? (
              <Tag tone="ok">Résolu</Tag>
            ) : (
              <Button
                size="sm"
                disabled={!canWrite || busy}
                onClick={async () => {
                  const r = await run(() => liveOpsUseCases.resolveIncident(i, "Traité par l’équipe opérations"), "Incident résolu.");
                  if (r) onChange(r);
                }}
              >
                Marquer résolu
              </Button>
            ),
        },
      ]}
    />
  );
}
