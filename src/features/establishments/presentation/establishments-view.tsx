"use client";

import { useState } from "react";
import { useAction } from "@/shared/hooks/use-action";
import { useResource } from "@/shared/hooks/use-resource";
import { fcfa, percent } from "@/shared/lib/format";
import { useCanWrite } from "@/shared/ui/app-shell";
import { DataTable } from "@/shared/ui/data-table";
import { Dialog } from "@/shared/ui/dialog";
import { Button, Card, Field, fieldClass, InfoRow, Note, PageHeader, Segmented, Tag, type Tone } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { establishmentsUseCases } from "../application/establishments.use-cases";
import {
  ACTIVITY_LABELS,
  ESTABLISHMENT_STATUS_LABELS,
  effectiveRate,
  highRejection,
  type Activity,
  type Establishment,
  type EstablishmentStatus,
} from "../domain/establishment";

const STATUS_TONE: Record<EstablishmentStatus, Tone> = { open: "ok", paused: "warn", verifying: "info", suspended: "bad" };

export function EstablishmentsView() {
  const [activity, setActivity] = useState<Activity | "all">("all");
  const list = useResource(() => establishmentsUseCases.list(activity), activity);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <>
      <PageHeader title="Établissements">
        <Segmented
          label="Métier"
          value={activity}
          onChange={setActivity}
          options={[["all", "Tous"], ...(Object.entries(ACTIVITY_LABELS) as Array<[Activity, string]>)]}
        />
      </PageHeader>
      <ResourceView state={list} onRetry={list.reload}>
        {(rows) => {
          const selected = rows.find((e) => e.id === selectedId) ?? null;
          return (
            <div className="grid gap-3.5 xl:grid-cols-[minmax(0,1fr)_360px]">
              <Card className="overflow-hidden">
                <DataTable<Establishment>
                  rows={rows}
                  rowKey={(e) => e.id}
                  selectedKey={selectedId}
                  onSelect={(e) => setSelectedId(e.id)}
                  columns={[
                    { key: "name", header: "Établissement", render: (e) => e.name },
                    { key: "act", header: "Métier", render: (e) => ACTIVITY_LABELS[e.activity] },
                    { key: "district", header: "Quartier", render: (e) => e.district },
                    { key: "status", header: "Statut", render: (e) => <Tag tone={STATUS_TONE[e.status]}>{ESTABLISHMENT_STATUS_LABELS[e.status]}</Tag> },
                    { key: "rate", header: "Commission", align: "right", render: (e) => `${percent(effectiveRate(e))}${e.commissionRate !== null ? " *" : ""}` },
                    { key: "rating", header: "Note", align: "right", render: (e) => (e.rating === null ? "—" : e.rating.toFixed(1).replace(".", ",")) },
                    { key: "sales", header: "Ventes 30 j", align: "right", render: (e) => (e.sales30d ? fcfa(e.sales30d) : "—") },
                    { key: "rej", header: "Refus", align: "right", render: (e) => <span className={highRejection(e) ? "font-bold text-bad" : undefined}>{percent(e.rejectionRate)}</span> },
                  ]}
                />
                <p className="px-4 py-2 text-xs text-muted">* commission négociée</p>
              </Card>
              {selected ? (
                <EstablishmentPanel key={selected.id} establishment={selected} onChange={(e) => list.mutate((l) => l.map((x) => (x.id === e.id ? e : x)))} />
              ) : (
                <Card className="flex items-center justify-center p-6 text-sm text-muted">Sélectionnez un établissement.</Card>
              )}
            </div>
          );
        }}
      </ResourceView>
    </>
  );
}

function EstablishmentPanel({ establishment: e, onChange }: { establishment: Establishment; onChange: (e: Establishment) => void }) {
  const { busy, run } = useAction();
  const canWrite = useCanWrite("establishments");
  const [rate, setRate] = useState(e.commissionRate === null ? "" : String(Math.round(e.commissionRate * 100)));
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [reason, setReason] = useState("");

  return (
    <Card className="flex flex-col gap-1 px-4 py-3.5">
      <div className="flex items-center justify-between">
        <b className="text-[15px]">{e.name}</b>
        <Tag tone={STATUS_TONE[e.status]}>{ESTABLISHMENT_STATUS_LABELS[e.status]}</Tag>
      </div>
      <span className="text-xs text-muted">
        {ACTIVITY_LABELS[e.activity]} · {e.district} · partenaire depuis {e.since}
      </span>
      <InfoRow label="Propriétaire">
        {e.ownerName} · {e.ownerPhone}
      </InfoRow>
      <InfoRow label="Versements">{e.payout}</InfoRow>
      <InfoRow label="Taux par défaut">{percent(e.defaultCommissionRate)}</InfoRow>
      <div className="mt-2 flex items-end gap-2">
        <Field label="Commission négociée (%)" hint="Vide = taux par défaut">
          <input className={fieldClass} inputMode="decimal" value={rate} onChange={(ev) => setRate(ev.target.value.replace(/[^\d.,]/g, ""))} />
        </Field>
        <Button
          disabled={!canWrite}
          busy={busy}
          onClick={async () => {
            const value = rate.trim() === "" ? null : Number(rate.replace(",", ".")) / 100;
            const r = await run(() => establishmentsUseCases.setCommission(e, value), "Commission mise à jour pour les prochaines ventes.");
            if (r) onChange(r);
          }}
        >
          Enregistrer
        </Button>
      </div>
      {e.status === "suspended" ? (
        <Button
          className="mt-2"
          tone="primary"
          disabled={!canWrite}
          busy={busy}
          onClick={async () => {
            const r = await run(() => establishmentsUseCases.reinstate(e), "Établissement réactivé.");
            if (r) onChange(r);
          }}
        >
          Réactiver
        </Button>
      ) : (
        <Button className="mt-2" tone="danger" disabled={!canWrite} onClick={() => setSuspendOpen(true)}>
          Suspendre…
        </Button>
      )}
      <Note className="mt-2">Le back-office supervise : menu, prix et planning restent gérés par l’établissement dans WAMI Business.</Note>
      <Dialog
        open={suspendOpen}
        title={`Suspendre ${e.name}`}
        onClose={() => setSuspendOpen(false)}
        footer={
          <>
            <Button onClick={() => setSuspendOpen(false)}>Annuler</Button>
            <Button
              tone="danger"
              busy={busy}
              onClick={async () => {
                const r = await run(() => establishmentsUseCases.suspend(e, reason), "Établissement suspendu : il n’apparaît plus dans l’app client.");
                if (r) {
                  onChange(r);
                  setSuspendOpen(false);
                }
              }}
            >
              Suspendre
            </Button>
          </>
        }
      >
        <Field label="Motif" hint="Communiqué au propriétaire.">
          <textarea className={`${fieldClass} h-20 py-2`} value={reason} onChange={(ev) => setReason(ev.target.value)} />
        </Field>
      </Dialog>
    </Card>
  );
}
