"use client";

import { useState } from "react";
import { useAction } from "@/shared/hooks/use-action";
import { useResource } from "@/shared/hooks/use-resource";
import { dayMonth, fcfa, percent } from "@/shared/lib/format";
import { useCanWrite } from "@/shared/ui/app-shell";
import { DataTable } from "@/shared/ui/data-table";
import { Dialog } from "@/shared/ui/dialog";
import { Button, Card, CardHeader, Field, fieldClass, InfoRow, Note, PageHeader, Tag } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { gridUseCases } from "../application/grid.use-cases";
import { PARCEL_CATEGORIES, PARCEL_LABELS, changes, draftFrom, type DistanceRange, type Grid, type GridDraft, type ZoneFee } from "../domain/grid";

export function GridView() {
  const grid = useResource(() => gridUseCases.active(), "grid");
  const canWrite = useCanWrite("delivery-grid");
  const [editing, setEditing] = useState(false);

  return (
    <>
      <PageHeader title="Grille tarifaire des livraisons">
        <Button tone="primary" className="ml-auto" disabled={!canWrite || !grid.data} onClick={() => setEditing(true)}>
          Publier une nouvelle version
        </Button>
      </PageHeader>
      <ResourceView state={grid} onRetry={grid.reload}>
        {(g) =>
          g === null ? (
            <Card className="p-6 text-center text-sm text-muted">Aucune grille publiée. La première grille doit être créée côté backend (POST /api/admin/pricing-grid).</Card>
          ) : (
            <>
              <Card className="flex flex-col gap-1 px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <b className="text-[15px]">Version {g.version}</b>
                  <Tag tone="ok">Active</Tag>
                  {g.activatedAt ? <span className="text-xs text-muted">depuis le {dayMonth(g.activatedAt)}</span> : null}
                </div>
                <InfoRow label="Supplément au kilo">{fcfa(g.weightSurchargePerKg)}</InfoRow>
                <InfoRow label="Coefficients d’urgence">{`Express ×${g.expressMultiplier} · Jour même ×${g.sameDayMultiplier}`}</InfoRow>
                <InfoRow label="Assurance">{`${percent(g.insuranceRate, 1)} (minimum ${fcfa(g.insuranceMinimum)})`}</InfoRow>
                <InfoRow label="Paiement à la livraison">{`${percent(g.codFeeRate, 1)} (minimum ${fcfa(g.codFeeMinimum)})`}</InfoRow>
              </Card>
              <div className="grid gap-3.5 lg:grid-cols-3">
                <Card className="overflow-hidden">
                  <CardHeader title="Tarif de base par catégorie" />
                  <DataTable rows={[...PARCEL_CATEGORIES]} rowKey={(c) => c} columns={[{ key: "c", header: "Catégorie", render: (c) => PARCEL_LABELS[c] }, { key: "f", header: "Tarif", align: "right", render: (c) => fcfa(g.baseFees[c]) }]} />
                  <p className="px-4 py-2 text-xs text-muted">Supplément fragile : {fcfa(g.fragileSurcharge)}</p>
                </Card>
                <Card className="overflow-hidden">
                  <CardHeader title="Tarifs entre zones" />
                  <DataTable<ZoneFee> rows={g.zones} rowKey={(z) => `${z.origin}>${z.destination}`} columns={[{ key: "z", header: "Trajet", render: (z) => `${z.origin} → ${z.destination}` }, { key: "f", header: "Tarif", align: "right", render: (z) => fcfa(z.fee) }]} />
                </Card>
                <Card className="overflow-hidden">
                  <CardHeader title="Tranches de distance" />
                  <DataTable<DistanceRange> rows={g.distanceRanges} rowKey={(r) => String(r.minKm)} columns={[{ key: "r", header: "Distance", render: (r) => (r.maxKm === null ? `≥ ${r.minKm} km` : `${r.minKm} – ${r.maxKm} km`) }, { key: "f", header: "Tarif", align: "right", render: (r) => fcfa(r.fee) }]} />
                </Card>
              </div>
              <Note>Une grille est immuable : « Publier une nouvelle version » en crée une, qui remplace aussitôt la grille active pour toutes les nouvelles livraisons. Les livraisons déjà créées gardent leur prix.</Note>
              {editing ? (
                <PublishDialog
                  active={g}
                  onClose={() => setEditing(false)}
                  onDone={() => {
                    setEditing(false);
                    grid.reload();
                  }}
                />
              ) : null}
            </>
          )
        }
      </ResourceView>
    </>
  );
}

const num = (v: string) => Number(v.replace(/[^\d.]/g, ""));

function PublishDialog({ active, onClose, onDone }: { active: Grid; onClose: () => void; onDone: () => void }) {
  const [d, setD] = useState<GridDraft>(() => draftFrom(active));
  const { busy, run } = useAction();
  const diff = changes(active, d);
  const set = <K extends keyof GridDraft>(k: K, v: GridDraft[K]) => setD({ ...d, [k]: v });
  const field = (label: string, value: number, onChange: (n: number) => void, hint?: string) => (
    <Field label={label} hint={hint}>
      <input className={fieldClass} inputMode="decimal" value={value} onChange={(e) => onChange(num(e.target.value))} />
    </Field>
  );

  return (
    <Dialog
      open
      title="Nouvelle version de la grille"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button
            tone="danger"
            busy={busy}
            onClick={async () => {
              const r = await run(() => gridUseCases.publish(d, [active.version]), `Grille ${d.version} publiée et active.`);
              if (r !== undefined) onDone();
            }}
          >
            Publier et activer
          </Button>
        </>
      }
    >
      <Field label="Nom de la version" hint={`Version actuelle : ${active.version}.`}>
        <input className={fieldClass} value={d.version} onChange={(e) => set("version", e.target.value)} placeholder="2026-12" />
      </Field>
      <b className="text-sm">Tarif de base</b>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {PARCEL_CATEGORIES.map((c) => (
          <span key={c}>{field(PARCEL_LABELS[c], d.baseFees[c], (n) => set("baseFees", { ...d.baseFees, [c]: n }))}</span>
        ))}
        {field("Supplément fragile", d.fragileSurcharge, (n) => set("fragileSurcharge", n))}
      </div>
      <b className="text-sm">Tarifs entre zones</b>
      {d.zones.map((z, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2">
          <Field label="Origine">
            <input className={fieldClass} value={z.origin} onChange={(e) => set("zones", d.zones.map((x, j) => (j === i ? { ...x, origin: e.target.value } : x)))} />
          </Field>
          <Field label="Destination">
            <input className={fieldClass} value={z.destination} onChange={(e) => set("zones", d.zones.map((x, j) => (j === i ? { ...x, destination: e.target.value } : x)))} />
          </Field>
          {field("Tarif (F)", z.fee, (n) => set("zones", d.zones.map((x, j) => (j === i ? { ...x, fee: n } : x))))}
          <Button size="sm" tone="ghost" disabled={d.zones.length === 1} onClick={() => set("zones", d.zones.filter((_, j) => j !== i))}>
            Retirer
          </Button>
        </div>
      ))}
      <Button size="sm" className="self-start" onClick={() => set("zones", [...d.zones, { origin: "", destination: "", fee: 0 }])}>
        Ajouter une zone
      </Button>
      <b className="text-sm">Tranches de distance</b>
      {d.distanceRanges.map((r, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2">
          {field("De (km)", r.minKm, (n) => set("distanceRanges", d.distanceRanges.map((x, j) => (j === i ? { ...x, minKm: n } : x))))}
          <Field label="À (km)" hint="Vide = sans limite.">
            <input className={fieldClass} inputMode="decimal" value={r.maxKm ?? ""} onChange={(e) => set("distanceRanges", d.distanceRanges.map((x, j) => (j === i ? { ...x, maxKm: e.target.value === "" ? null : num(e.target.value) } : x)))} />
          </Field>
          {field("Tarif (F)", r.fee, (n) => set("distanceRanges", d.distanceRanges.map((x, j) => (j === i ? { ...x, fee: n } : x))))}
          <Button size="sm" tone="ghost" disabled={d.distanceRanges.length === 1} onClick={() => set("distanceRanges", d.distanceRanges.filter((_, j) => j !== i))}>
            Retirer
          </Button>
        </div>
      ))}
      <Button size="sm" className="self-start" onClick={() => set("distanceRanges", [...d.distanceRanges, { minKm: 0, maxKm: null, fee: 0 }])}>
        Ajouter une tranche
      </Button>
      <b className="text-sm">Suppléments et frais</b>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {field("Supplément au kilo (F)", d.weightSurchargePerKg, (n) => set("weightSurchargePerKg", n))}
        {field("Express (×)", d.expressMultiplier, (n) => set("expressMultiplier", n), "Au moins 1.")}
        {field("Jour même (×)", d.sameDayMultiplier, (n) => set("sameDayMultiplier", n), "Au moins 1.")}
        {field("Assurance (%)", Math.round(d.insuranceRate * 1000) / 10, (n) => set("insuranceRate", n / 100))}
        {field("Assurance minimum (F)", d.insuranceMinimum, (n) => set("insuranceMinimum", n))}
        {field("Paiement à la livraison (%)", Math.round(d.codFeeRate * 1000) / 10, (n) => set("codFeeRate", n / 100))}
        {field("Frais minimum (F)", d.codFeeMinimum, (n) => set("codFeeMinimum", n))}
      </div>
      {diff.length > 0 ? (
        <Note>
          <b>Ce qui change :</b> {diff.join(" · ")}
        </Note>
      ) : (
        <Note>Aucun écart avec la grille active pour l’instant.</Note>
      )}
    </Dialog>
  );
}
