"use client";

import { useState } from "react";
import { useAction } from "@/shared/hooks/use-action";
import { useResource } from "@/shared/hooks/use-resource";
import { dayMonth, fcfa, percent } from "@/shared/lib/format";
import { useCanWrite } from "@/shared/ui/app-shell";
import { DataTable } from "@/shared/ui/data-table";
import { Dialog } from "@/shared/ui/dialog";
import { WamiMap } from "@/shared/ui/map/wami-map";
import { Button, Card, CardHeader, Field, fieldClass, Note, PageHeader, Tag } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { pricingUseCases } from "../application/pricing.use-cases";
import { estimateFare, type Commission, type Tariff } from "../domain/pricing";

export function PricingView() {
  const zones = useResource(() => pricingUseCases.zones(), "zones");
  const [zoneId, setZoneId] = useState("cotonou");
  const tariffs = useResource(() => pricingUseCases.tariffs(zoneId), zoneId);
  const commissions = useResource(() => pricingUseCases.commissions(), "commissions");
  const [editing, setEditing] = useState<Tariff | null>(null);
  const canWrite = useCanWrite("pricing-zones");

  return (
    <>
      <PageHeader title="Tarifs et zones">
        <label className="w-56">
          <span className="sr-only">Zone</span>
          <select className={fieldClass} value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
            {(zones.data ?? []).map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </label>
        <span className="ml-auto text-xs text-muted">Toute modification est historisée et ne s’applique qu’aux nouvelles demandes.</span>
      </PageHeader>
      <div className="grid gap-3.5 xl:grid-cols-[340px_minmax(0,1fr)]">
        <Card className="flex flex-col overflow-hidden">
          <CardHeader title="Zones de service" />
          <div className="h-72">
            <ResourceView state={zones} onRetry={zones.reload}>
              {(list) => <WamiMap zoom={11} areas={list.map((z) => ({ id: z.id, polygon: z.polygon, color: z.color, label: z.name }))} />}
            </ResourceView>
          </div>
          <ul className="px-4 py-3">
            {(zones.data ?? []).map((z) => (
              <li key={z.id} className="flex items-center justify-between py-1 text-[13px]">
                <span className="flex items-center gap-2">
                  <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: z.color }} />
                  {z.name}
                </span>
                <Tag tone={z.status === "active" ? "ok" : "neutral"}>{z.status === "active" ? "Active" : "Bientôt"}</Tag>
              </li>
            ))}
          </ul>
          <Note className="mx-4 mb-4">Dessin des zones sur la carte : à prévoir (Leaflet.draw). Pour l’instant, contours fournis par le backend.</Note>
        </Card>
        <div className="flex min-w-0 flex-col gap-3.5">
          <Card className="overflow-hidden">
            <CardHeader title="Grille tarifaire">
              <Tag tone="warn">Valeurs à valider</Tag>
            </CardHeader>
            <ResourceView state={tariffs} onRetry={tariffs.reload}>
              {(rows) => (
                <DataTable<Tariff>
                  rows={rows}
                  rowKey={(t) => t.service}
                  columns={[
                    { key: "label", header: "Service", render: (t) => <b>{t.label}</b> },
                    { key: "base", header: "Prise en charge", align: "right", render: (t) => fcfa(t.base) },
                    { key: "km", header: "Par km", align: "right", render: (t) => fcfa(t.perKm) },
                    { key: "min", header: "Par min", align: "right", render: (t) => (t.perMin ? fcfa(t.perMin) : "—") },
                    { key: "minimum", header: "Minimum", align: "right", render: (t) => fcfa(t.minimum) },
                    { key: "wait", header: "Attente", render: (t) => (t.waitPerMin ? `${t.freeWaitMin} min gratuites puis ${fcfa(t.waitPerMin)}/min` : "—") },
                    { key: "pause", header: "Pause", align: "right", render: (t) => (t.pausePerMin ? `${fcfa(t.pausePerMin)}/min` : "—") },
                    { key: "ex", header: "5 km · 15 min", align: "right", render: (t) => fcfa(estimateFare(t, 5, 15)) },
                    {
                      key: "act",
                      header: "",
                      render: (t) => (
                        <Button size="sm" disabled={!canWrite} onClick={() => setEditing(t)}>
                          Modifier
                        </Button>
                      ),
                    },
                  ]}
                />
              )}
            </ResourceView>
          </Card>
          <Card className="overflow-hidden">
            <CardHeader title="Commissions WAMI par activité">
              <span className="text-xs text-muted">Surchargeables par établissement</span>
            </CardHeader>
            <ResourceView state={commissions} onRetry={commissions.reload}>
              {(rows) => (
                <DataTable<Commission>
                  rows={rows}
                  rowKey={(c) => c.activity}
                  columns={[
                    { key: "act", header: "Activité", render: (c) => c.activity },
                    { key: "rate", header: "Taux", align: "right", render: (c) => (c.rate === null ? <Tag tone="warn">à valider</Tag> : percent(c.rate)) },
                    { key: "col", header: "Prélèvement", render: (c) => c.collection },
                    { key: "upd", header: "Dernière modification", render: (c) => (c.updatedAt ? `${c.updatedBy} · ${dayMonth(c.updatedAt)}` : "—") },
                  ]}
                />
              )}
            </ResourceView>
          </Card>
        </div>
      </div>
      {editing ? (
        <TariffDialog
          zoneId={zoneId}
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={(t) => {
            tariffs.mutate((l) => l.map((x) => (x.service === t.service ? t : x)));
            setEditing(null);
          }}
        />
      ) : null}
    </>
  );
}

function TariffDialog({ zoneId, initial, onClose, onSaved }: { zoneId: string; initial: Tariff; onClose: () => void; onSaved: (t: Tariff) => void }) {
  const [t, setT] = useState(initial);
  const { busy, run } = useAction();
  const num = (k: keyof Tariff) => (
    <input className={fieldClass} inputMode="numeric" value={String(t[k])} onChange={(e) => setT({ ...t, [k]: Number(e.target.value.replace(/\D/g, "")) })} />
  );
  return (
    <Dialog
      open
      title={`Tarif ${t.label}`}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button
            tone="primary"
            busy={busy}
            onClick={async () => {
              const r = await run(() => pricingUseCases.saveTariff(zoneId, t), "Tarif enregistré pour les nouvelles demandes.");
              if (r) onSaved(r);
            }}
          >
            Enregistrer
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Prise en charge (F)">{num("base")}</Field>
        <Field label="Par km (F)">{num("perKm")}</Field>
        <Field label="Par minute (F)">{num("perMin")}</Field>
        <Field label="Minimum (F)">{num("minimum")}</Field>
        <Field label="Attente gratuite (min)">{num("freeWaitMin")}</Field>
        <Field label="Attente, par minute (F)">{num("waitPerMin")}</Field>
        <Field label="Pause, par minute (F)">{num("pausePerMin")}</Field>
      </div>
      <p className="text-[13px]">
        Exemple 5 km, 15 min : <b>{fcfa(estimateFare(t, 5, 15))}</b>
      </p>
    </Dialog>
  );
}
