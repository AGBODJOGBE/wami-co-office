"use client";

import { useState } from "react";
import { useAction } from "@/shared/hooks/use-action";
import { Dialog } from "@/shared/ui/dialog";
import { Button, Field, fieldClass, Note } from "@/shared/ui/primitives";
import { driverBonusUseCases } from "../application/driver-bonus.use-cases";
import { BONUS_FAMILY_LABELS, BONUS_VEHICLE_CATEGORIES, TIER_LABELS, emptyDraft, type BonusConfig, type BonusDraft, type BonusFamily, type TierDraft } from "../domain/bonus";

const decimal = (v: string) => Number(v.replace(/[^\d.]/g, ""));

/** Création (config absente) ou édition d'une configuration de primes d'une famille. */
export function BonusConfigDialog({ family, config, onClose, onDone }: { family: BonusFamily; config: BonusConfig | null; onClose: () => void; onDone: () => void }) {
  const [d, setD] = useState<BonusDraft>(config?.draft ?? emptyDraft(family));
  const { busy, run } = useAction();
  const labels = TIER_LABELS[family];
  const setTier = (i: number, patch: Partial<TierDraft>) => setD({ ...d, tiers: d.tiers.map((t, j) => (j === i ? { ...t, ...patch } : t)) });

  return (
    <Dialog
      open
      title={config ? `Modifier « ${config.name} »` : `Nouvelle configuration · ${BONUS_FAMILY_LABELS[family]}`}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button
            tone="primary"
            busy={busy}
            onClick={async () => {
              const r = await run(() => (config ? driverBonusUseCases.update(config, d) : driverBonusUseCases.create(d)), config ? "Configuration modifiée." : "Configuration créée (inactive : activez-la pour l’appliquer).");
              if (r !== undefined) onDone();
            }}
          >
            Enregistrer
          </Button>
        </>
      }
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Nom">
          <input className={fieldClass} value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} />
        </Field>
        <Field label="Catégorie de véhicule" hint={config ? "Non modifiable après création." : undefined}>
          <select className={fieldClass} disabled={config !== null} value={d.vehicleCategory} onChange={(e) => setD({ ...d, vehicleCategory: e.target.value })}>
            {BONUS_VEHICLE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c === "ALL" ? "Toutes" : c}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Description">
        <input className={fieldClass} value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} />
      </Field>
      {family === "quality" ? (
        <Field label="Courses minimales par mois">
          <input className={fieldClass} inputMode="numeric" value={d.minRidesPerMonth} onChange={(e) => setD({ ...d, minRidesPerMonth: Number(e.target.value.replace(/\D/g, "")) })} />
        </Field>
      ) : null}
      <b className="text-sm">Paliers</b>
      <div className="flex flex-col gap-2">
        {d.tiers.map((t, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2 md:grid-cols-[1.2fr_1fr_1fr_auto]">
            {family === "activity" ? (
              <Field label="Nom du palier">
                <input className={fieldClass} value={t.name} onChange={(e) => setTier(i, { name: e.target.value })} />
              </Field>
            ) : (
              <span className="hidden md:block" />
            )}
            <Field label={labels.threshold}>
              <input className={fieldClass} inputMode="decimal" value={t.threshold} onChange={(e) => setTier(i, { threshold: decimal(e.target.value) })} />
            </Field>
            <Field label={labels.value}>
              <input className={fieldClass} inputMode="decimal" value={t.value} onChange={(e) => setTier(i, { value: decimal(e.target.value) })} />
            </Field>
            <Button size="sm" tone="ghost" disabled={d.tiers.length === 1} onClick={() => setD({ ...d, tiers: d.tiers.filter((_, j) => j !== i) })}>
              Retirer
            </Button>
          </div>
        ))}
        <Button size="sm" className="self-start" onClick={() => setD({ ...d, tiers: [...d.tiers, { name: "", threshold: 0, value: 0 }] })}>
          Ajouter un palier
        </Button>
      </div>
      <Note>Montants proposés, à valider. Une seule configuration est active par famille : activer celle-ci désactive la précédente.</Note>
    </Dialog>
  );
}
