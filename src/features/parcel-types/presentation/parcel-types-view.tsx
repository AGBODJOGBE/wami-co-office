"use client";

import { useState } from "react";
import { useAction } from "@/shared/hooks/use-action";
import { useResource } from "@/shared/hooks/use-resource";
import { useCanWrite } from "@/shared/ui/app-shell";
import { DataTable } from "@/shared/ui/data-table";
import { Dialog } from "@/shared/ui/dialog";
import { Button, Card, Field, fieldClass, PageHeader, Tag, Toggle } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { parcelTypesUseCases } from "../application/parcel-types.use-cases";
import type { ParcelType, ParcelVehicle } from "../domain/parcel-type";

const VEHICLES: Array<[ParcelVehicle, string]> = [
  ["moto", "Moto"],
  ["tricycle", "Tricycle"],
  ["van", "Fourgonnette"],
];

const EMPTY: ParcelType = { code: "", label: "", description: "", maxWeightKg: 5, maxSizeCm: 40, vehicles: ["moto"], priceMultiplier: 1, active: true };

export function ParcelTypesView() {
  const types = useResource(() => parcelTypesUseCases.list(), "parcel-types");
  const canWrite = useCanWrite("parcel-types");
  const [editing, setEditing] = useState<{ value: ParcelType; isNew: boolean } | null>(null);

  return (
    <>
      <PageHeader title="Types de colis">
        <Button tone="primary" className="ml-auto" disabled={!canWrite} onClick={() => setEditing({ value: EMPTY, isNew: true })}>
          Nouveau type
        </Button>
      </PageHeader>
      <Card className="overflow-hidden">
        <ResourceView state={types} onRetry={types.reload}>
          {(list) => (
            <DataTable<ParcelType>
              rows={list}
              rowKey={(t) => t.code}
              onSelect={canWrite ? (t) => setEditing({ value: t, isNew: false }) : undefined}
              columns={[
                { key: "label", header: "Type", render: (t) => `${t.code} · ${t.label}` },
                { key: "desc", header: "Exemples", render: (t) => t.description },
                { key: "weight", header: "Poids max", align: "right", render: (t) => `${t.maxWeightKg} kg` },
                { key: "size", header: "Taille max", align: "right", render: (t) => `${t.maxSizeCm} cm` },
                { key: "veh", header: "Véhicules", render: (t) => t.vehicles.map((v) => VEHICLES.find((x) => x[0] === v)?.[1]).join(", ") },
                { key: "mult", header: "Prix", align: "right", render: (t) => `× ${t.priceMultiplier.toString().replace(".", ",")}` },
                { key: "active", header: "", render: (t) => <Tag tone={t.active ? "ok" : "neutral"}>{t.active ? "Proposé" : "Masqué"}</Tag> },
              ]}
            />
          )}
        </ResourceView>
      </Card>
      {editing ? (
        <ParcelTypeDialog
          initial={editing.value}
          isNew={editing.isNew}
          all={types.data ?? []}
          onClose={() => setEditing(null)}
          onSaved={(t) => {
            types.mutate((l) => (editing.isNew ? [...l, t] : l.map((x) => (x.code === t.code ? t : x))));
            setEditing(null);
          }}
        />
      ) : null}
    </>
  );
}

function ParcelTypeDialog({
  initial,
  isNew,
  all,
  onClose,
  onSaved,
}: {
  initial: ParcelType;
  isNew: boolean;
  all: ParcelType[];
  onClose: () => void;
  onSaved: (t: ParcelType) => void;
}) {
  const [t, setT] = useState(initial);
  const { busy, run } = useAction();
  const set = <K extends keyof ParcelType>(k: K, v: ParcelType[K]) => setT({ ...t, [k]: v });

  return (
    <Dialog
      open
      title={isNew ? "Nouveau type de colis" : `Modifier ${t.code} · ${t.label}`}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button
            tone="primary"
            busy={busy}
            onClick={async () => {
              const r = await run(() => parcelTypesUseCases.save(t, all, isNew), "Type de colis enregistré.");
              if (r) onSaved(r);
            }}
          >
            Enregistrer
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Code">
          <input className={fieldClass} value={t.code} disabled={!isNew} onChange={(e) => set("code", e.target.value.toUpperCase())} />
        </Field>
        <Field label="Libellé">
          <input className={fieldClass} value={t.label} onChange={(e) => set("label", e.target.value)} />
        </Field>
        <Field label="Poids max (kg)">
          <input className={fieldClass} inputMode="decimal" value={t.maxWeightKg} onChange={(e) => set("maxWeightKg", Number(e.target.value) || 0)} />
        </Field>
        <Field label="Taille max (cm)">
          <input className={fieldClass} inputMode="numeric" value={t.maxSizeCm} onChange={(e) => set("maxSizeCm", Number(e.target.value) || 0)} />
        </Field>
        <Field label="Multiplicateur de prix">
          <input className={fieldClass} inputMode="decimal" value={t.priceMultiplier} onChange={(e) => set("priceMultiplier", Number(e.target.value.replace(",", ".")) || 0)} />
        </Field>
        <Field label="Exemples">
          <input className={fieldClass} value={t.description} onChange={(e) => set("description", e.target.value)} />
        </Field>
      </div>
      <fieldset className="flex flex-wrap gap-3 text-[13px]">
        <legend className="mb-1 text-[10.5px] font-bold uppercase tracking-wider text-muted">Véhicules autorisés</legend>
        {VEHICLES.map(([v, label]) => (
          <label key={v} className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={t.vehicles.includes(v)}
              onChange={(e) => set("vehicles", e.target.checked ? [...t.vehicles, v] : t.vehicles.filter((x) => x !== v))}
            />
            {label}
          </label>
        ))}
      </fieldset>
      <div className="flex items-center justify-between text-[13px]">
        <span>Proposé aux clients</span>
        <Toggle checked={t.active} onChange={(v) => set("active", v)} label="Proposé aux clients" />
      </div>
    </Dialog>
  );
}
