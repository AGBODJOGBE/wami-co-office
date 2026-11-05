"use client";

import { useState } from "react";
import { useAction } from "@/shared/hooks/use-action";
import { Dialog } from "@/shared/ui/dialog";
import { Button, Field, fieldClass, Note } from "@/shared/ui/primitives";
import { referralsUseCases } from "../application/referrals.use-cases";
import { ACTION_LABELS, PROFILE_LABELS, PROFILE_TYPES, defaultDraft, fillMatrix, type ActionType, type ConfigDraft, type RewardMode, type RuleDraft } from "../domain/config-draft";
import type { ReferralConfig } from "../domain/referral";

const num = (v: string) => Number(v.replace(/\D/g, ""));
const optNum = (v: string) => (v.trim() === "" ? null : num(v));

/** Création (config absente) ou édition d'une configuration de parrainage. */
export function ConfigDialog({ config, onClose, onDone }: { config: ReferralConfig | null; onClose: () => void; onDone: () => void }) {
  const [d, setD] = useState<ConfigDraft>(config?.draft ?? defaultDraft());
  const { busy, run } = useAction();

  const setRule = (i: number, patch: Partial<RuleDraft>) => setD({ ...d, rules: d.rules.map((r, j) => (j === i ? { ...r, ...patch } : r)) });

  return (
    <Dialog
      open
      title={config ? `Modifier « ${config.name} »` : "Nouvelle configuration de parrainage"}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button
            tone="primary"
            busy={busy}
            onClick={async () => {
              const r = await run(() => (config ? referralsUseCases.updateConfig(config, d) : referralsUseCases.createConfig(d)), config ? "Configuration modifiée." : "Configuration créée (inactive : activez-la pour l’appliquer).");
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
        <Field label="Description">
          <input className={fieldClass} value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} />
        </Field>
        <Field label="Expiration (jours)" hint="Vide = un parrainage n’expire jamais.">
          <input className={fieldClass} inputMode="numeric" value={d.expirationDays ?? ""} onChange={(e) => setD({ ...d, expirationDays: optNum(e.target.value) })} />
        </Field>
        <Field label="Plafond global par jour" hint="Vide = aucun plafond global.">
          <input className={fieldClass} inputMode="numeric" value={d.globalMaxPerDay ?? ""} onChange={(e) => setD({ ...d, globalMaxPerDay: optNum(e.target.value) })} />
        </Field>
      </div>

      <b className="mt-2 text-sm">Récompenses (parrain → filleul)</b>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => setD({ ...d, rules: fillMatrix(d.rules, d.rules[0]!) })}>
          Copier la première ligne partout
        </Button>
        <span className="text-xs text-muted">FIXED : FCFA · PERCENTAGE : % de la course, avec plafond en FCFA</span>
      </div>
      <div className="max-h-72 overflow-auto rounded-[10px] border border-line">
        <table className="w-full text-[12px]">
          <thead className="sticky top-0 bg-canvas">
            <tr>
              {["Parrain", "Filleul", "Mode", "Parrain", "Filleul", "Plafond parrain", "Plafond filleul"].map((h, i) => (
                <th key={i} scope="col" className="px-2 py-1.5 text-left text-[11px] text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {d.rules.map((r, i) => (
              <tr key={`${r.referrerType}-${r.referredType}`} className="border-t border-field">
                <td className="px-2 py-1">{PROFILE_LABELS[r.referrerType]}</td>
                <td className="px-2 py-1">{PROFILE_LABELS[r.referredType]}</td>
                <td className="px-2 py-1">
                  <select aria-label="Mode" className={`${fieldClass} h-7 w-28`} value={r.mode} onChange={(e) => setRule(i, { mode: e.target.value as RewardMode })}>
                    <option value="FIXED">Fixe</option>
                    <option value="PERCENTAGE">Pourcentage</option>
                  </select>
                </td>
                <td className="px-2 py-1">
                  <input aria-label="Montant parrain" className={`${fieldClass} h-7 w-20`} inputMode="decimal" value={r.referrerAmount} onChange={(e) => setRule(i, { referrerAmount: Number(e.target.value.replace(/[^\d.]/g, "")) })} />
                </td>
                <td className="px-2 py-1">
                  <input aria-label="Montant filleul" className={`${fieldClass} h-7 w-20`} inputMode="decimal" value={r.referredAmount} onChange={(e) => setRule(i, { referredAmount: Number(e.target.value.replace(/[^\d.]/g, "")) })} />
                </td>
                <td className="px-2 py-1">
                  <input aria-label="Plafond parrain" className={`${fieldClass} h-7 w-20`} disabled={r.mode === "FIXED"} inputMode="numeric" value={r.referrerCap ?? ""} onChange={(e) => setRule(i, { referrerCap: optNum(e.target.value) })} />
                </td>
                <td className="px-2 py-1">
                  <input aria-label="Plafond filleul" className={`${fieldClass} h-7 w-20`} disabled={r.mode === "FIXED"} inputMode="numeric" value={r.referredCap ?? ""} onChange={(e) => setRule(i, { referredCap: optNum(e.target.value) })} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <b className="mt-2 text-sm">Limites et conditions de validation, par profil invité</b>
      <div className="overflow-auto rounded-[10px] border border-line">
        <table className="w-full text-[12px]">
          <thead className="bg-canvas">
            <tr>
              {["Profil invité", "Max / mois", "Max / jour", "Actions requises", "Type d’action"].map((h) => (
                <th key={h} scope="col" className="px-2 py-1.5 text-left text-[11px] text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PROFILE_TYPES.map((t) => {
              const l = d.limits.find((x) => x.referredType === t)!;
              const c = d.conditions.find((x) => x.referredType === t)!;
              return (
                <tr key={t} className="border-t border-field">
                  <td className="px-2 py-1">{PROFILE_LABELS[t]}</td>
                  <td className="px-2 py-1">
                    <input aria-label={`Max par mois, ${PROFILE_LABELS[t]}`} className={`${fieldClass} h-7 w-20`} inputMode="numeric" value={l.maxPerMonth} onChange={(e) => setD({ ...d, limits: d.limits.map((x) => (x.referredType === t ? { ...x, maxPerMonth: num(e.target.value) } : x)) })} />
                  </td>
                  <td className="px-2 py-1">
                    <input aria-label={`Max par jour, ${PROFILE_LABELS[t]}`} className={`${fieldClass} h-7 w-20`} inputMode="numeric" value={l.maxPerDay} onChange={(e) => setD({ ...d, limits: d.limits.map((x) => (x.referredType === t ? { ...x, maxPerDay: num(e.target.value) } : x)) })} />
                  </td>
                  <td className="px-2 py-1">
                    <input aria-label={`Actions requises, ${PROFILE_LABELS[t]}`} className={`${fieldClass} h-7 w-20`} inputMode="numeric" value={c.actionsRequired} onChange={(e) => setD({ ...d, conditions: d.conditions.map((x) => (x.referredType === t ? { ...x, actionsRequired: num(e.target.value) } : x)) })} />
                  </td>
                  <td className="px-2 py-1">
                    <select aria-label={`Type d’action, ${PROFILE_LABELS[t]}`} className={`${fieldClass} h-7 w-32`} value={c.actionType} onChange={(e) => setD({ ...d, conditions: d.conditions.map((x) => (x.referredType === t ? { ...x, actionType: e.target.value as ActionType } : x)) })}>
                      {(Object.keys(ACTION_LABELS) as ActionType[]).map((a) => (
                        <option key={a} value={a}>
                          {ACTION_LABELS[a]}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Note>Montants proposés, à valider. Une nouvelle configuration est créée inactive ; en activer une désactive la précédente.</Note>
    </Dialog>
  );
}
