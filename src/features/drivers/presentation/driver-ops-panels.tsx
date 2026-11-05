"use client";

import { useState } from "react";
import { useAction } from "@/shared/hooks/use-action";
import { useResource } from "@/shared/hooks/use-resource";
import { dateTime, dayMonth } from "@/shared/lib/format";
import { useCanWrite } from "@/shared/ui/app-shell";
import { DataTable } from "@/shared/ui/data-table";
import { Dialog } from "@/shared/ui/dialog";
import { Button, Card, CardHeader, Field, fieldClass, Note, Tag } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { driverOpsUseCases } from "../application/driver-ops.use-cases";
import { infoFrom, type DriverInfoDraft, DRIVER_TYPE_LABELS, END_REASON_LABELS, hoursLabel, type DriverSession, type DriverType, type OnlineDriver, type PendingDriver } from "../domain/driver-ops";

/** Chauffeurs actuellement en ligne, avec leur dernière position. */
export function OnlineDriversPanel() {
  const online = useResource(() => driverOpsUseCases.online(), "online");
  return (
    <Card className="overflow-hidden">
      <ResourceView state={online} onRetry={online.reload}>
        {(rows) => (
          <DataTable<OnlineDriver>
            rows={rows}
            rowKey={(d) => d.id}
            empty="Aucun chauffeur en ligne."
            columns={[
              { key: "n", header: "Chauffeur", render: (d) => <span className="flex flex-col"><b>{d.name}</b><span className="text-xs text-muted">{d.phone}</span></span> },
              { key: "v", header: "Véhicule", render: (d) => d.vehicle },
              { key: "r", header: "Note", align: "right", render: (d) => `${d.rating.toFixed(1).replace(".", ",")} (${d.totalRides})` },
              { key: "p", header: "Position", render: (d) => `${d.latitude.toFixed(4)}, ${d.longitude.toFixed(4)}` },
              { key: "s", header: "", render: (d) => (d.inRide ? <Tag tone="info">En course</Tag> : <Tag tone="ok">Disponible</Tag>) },
              { key: "u", header: "Mis à jour", render: (d) => dateTime(d.updatedAt) },
            ]}
          />
        )}
      </ResourceView>
    </Card>
  );
}

/** Candidatures de chauffeurs en attente d'approbation. */
export function PendingDriversPanel() {
  const pending = useResource(() => driverOpsUseCases.pending(), "pending");
  const canWrite = useCanWrite("drivers");
  const { busy, run } = useAction();
  return (
    <Card className="overflow-hidden">
      <ResourceView state={pending} onRetry={pending.reload}>
        {(rows) => (
          <>
            <DataTable<PendingDriver>
              rows={rows}
              rowKey={(d) => d.id}
              empty="Aucune candidature en attente."
              columns={[
                { key: "id", header: "Candidat", render: (d) => <code className="text-xs">{d.id}</code> },
                { key: "c", header: "Candidature", render: (d) => dayMonth(d.createdAt) },
                { key: "docs", header: "Documents", render: (d) => (d.documentsVerified ? <Tag tone="ok">Vérifiés</Tag> : <Tag tone="warn">À vérifier</Tag>) },
                {
                  key: "a",
                  header: "",
                  render: (d) => (
                    <Button
                      size="sm"
                      tone="primary"
                      disabled={!canWrite || busy}
                      onClick={async () => {
                        const r = await run(() => driverOpsUseCases.approve(d), "Chauffeur approuvé.");
                        if (r !== undefined) pending.reload();
                      }}
                    >
                      Approuver
                    </Button>
                  ),
                },
              ]}
            />
            <Note className="m-4">Un véhicule WAMI-CO exige un contrat actif avant l’approbation (règle du backend).</Note>
          </>
        )}
      </ResourceView>
    </Card>
  );
}

/** Type d'activité d'un chauffeur. Pris en compte à sa prochaine connexion. */
export function DriverTypeSelect({ driverId, current, onChanged }: { driverId: string; current: DriverType; onChanged: (t: DriverType) => void }) {
  const canWrite = useCanWrite("drivers");
  const { busy, run } = useAction();
  return (
    <label className="flex flex-col gap-1 text-[12.5px]">
      <span className="text-muted">Type d’activité</span>
      <select
        className={`${fieldClass} h-9`}
        value={current}
        disabled={!canWrite || busy}
        onChange={async (e) => {
          const next = e.target.value as DriverType;
          const r = await run(() => driverOpsUseCases.setType(driverId, current, next), "Type modifié : effectif à sa prochaine connexion.");
          if (r !== undefined) onChanged(next);
        }}
      >
        {(Object.keys(DRIVER_TYPE_LABELS) as DriverType[]).map((t) => (
          <option key={t} value={t}>
            {DRIVER_TYPE_LABELS[t]}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Dernières sessions de connexion et temps total en ligne. */
export function DriverSessionsPanel({ driverId }: { driverId: string }) {
  const sessions = useResource(() => driverOpsUseCases.sessions(driverId), driverId);
  return (
    <div className="mt-2 flex flex-col gap-1.5">
      <CardHeader title="Sessions de connexion" />
      <ResourceView state={sessions} onRetry={sessions.reload}>
        {(s) => (
          <>
            <p className="text-xs text-muted">Temps total en ligne : {hoursLabel(s.totalSeconds)}</p>
            <DataTable<DriverSession>
              rows={s.sessions}
              rowKey={(x) => x.id}
              empty="Aucune session."
              columns={[
                { key: "d", header: "Début", render: (x) => dateTime(x.startedAt) },
                { key: "l", header: "Durée", align: "right", render: (x) => (x.durationSeconds === null ? "en cours" : hoursLabel(x.durationSeconds)) },
                { key: "r", header: "Fin", render: (x) => (x.endReason ? (END_REASON_LABELS[x.endReason] ?? x.endReason) : "—") },
              ]}
            />
          </>
        )}
      </ResourceView>
    </div>
  );
}

/** Modification des informations personnelles d'un chauffeur (le backend ne modifie que les champs envoyés). */
export function EditDriverInfoButton({ driverId, name, phone }: { driverId: string; name: string; phone: string }) {
  const canWrite = useCanWrite("drivers");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button disabled={!canWrite} onClick={() => setOpen(true)}>
        Modifier les informations…
      </Button>
      {open ? <InfoDialog driverId={driverId} original={infoFrom(name, phone)} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function InfoDialog({ driverId, original, onClose }: { driverId: string; original: DriverInfoDraft; onClose: () => void }) {
  const [d, setD] = useState<DriverInfoDraft>(original);
  const { busy, run } = useAction();
  const set = <K extends keyof DriverInfoDraft>(k: K, v: DriverInfoDraft[K]) => setD({ ...d, [k]: v });
  const text = (k: keyof DriverInfoDraft, label: string, hint?: string) => (
    <Field label={label} hint={hint}>
      <input className={fieldClass} value={d[k]} onChange={(e) => set(k, e.target.value as never)} />
    </Field>
  );
  return (
    <Dialog
      open
      title="Modifier les informations"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button
            tone="primary"
            busy={busy}
            onClick={async () => {
              const r = await run(() => driverOpsUseCases.updateInfo(driverId, d, original), "Informations modifiées.");
              if (r !== undefined) onClose();
            }}
          >
            Enregistrer
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        {text("firstName", "Prénom")}
        {text("lastName", "Nom")}
        {text("phoneNumber", "Téléphone", "Le numéro devra être vérifié de nouveau.")}
        {text("email", "E-mail")}
      </div>
      <Field label="Genre">
        <select className={fieldClass} value={d.gender} onChange={(e) => set("gender", e.target.value as DriverInfoDraft["gender"])}>
          <option value="">Inchangé</option>
          <option value="MALE">Homme</option>
          <option value="FEMALE">Femme</option>
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        {text("city", "Ville", "Adresse : ville et quartier obligatoires.")}
        {text("quarter", "Quartier")}
        {text("street", "Rue")}
        {text("landmark", "Repère")}
      </div>
      <Note>Seuls les champs modifiés sont envoyés. Le nom, l’e-mail et le téléphone du chauffeur ne sont pas relus par la liste du backend : vérifiez-les avant d’enregistrer.</Note>
    </Dialog>
  );
}
