"use client";

import { useState } from "react";
import { useAction } from "@/shared/hooks/use-action";
import { useResource } from "@/shared/hooks/use-resource";
import { dayMonth, fcfa } from "@/shared/lib/format";
import { useCanWrite } from "@/shared/ui/app-shell";
import { DataTable } from "@/shared/ui/data-table";
import { Dialog } from "@/shared/ui/dialog";
import { Button, Card, Field, fieldClass, PageHeader, Segmented, Tag, Toggle, type Tone } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { promoCodesUseCases } from "../application/promo-codes.use-cases";
import { PROMO_SERVICE_LABELS, promoState, type PromoCode, type PromoService, type PromoState } from "../domain/promo-code";

const STATE: Record<PromoState, [Tone, string]> = {
  scheduled: ["neutral", "Programmé"],
  running: ["ok", "Actif"],
  exhausted: ["warn", "Épuisé"],
  ended: ["neutral", "Terminé"],
  disabled: ["neutral", "Désactivé"],
};

export function PromoCodesView() {
  const list = useResource(() => promoCodesUseCases.list(), "promos");
  const canWrite = useCanWrite("promo-codes");
  const { busy, run } = useAction();
  const [creating, setCreating] = useState(false);
  const [now] = useState(() => new Date());

  return (
    <>
      <PageHeader title="Codes promo">
        <Button tone="primary" className="ml-auto" disabled={!canWrite} onClick={() => setCreating(true)}>
          Nouveau code
        </Button>
      </PageHeader>
      <Card className="overflow-hidden">
        <ResourceView state={list} onRetry={list.reload}>
          {(rows) => (
            <DataTable<PromoCode>
              rows={rows}
              rowKey={(p) => p.code}
              columns={[
                { key: "code", header: "Code", render: (p) => <b>{p.code}</b> },
                { key: "desc", header: "Remise", render: (p) => (p.kind === "percent" ? `−${p.value} % (max ${fcfa(p.cap ?? 0)})` : `−${fcfa(p.value)}`) },
                { key: "services", header: "Services", render: (p) => p.services.map((s) => PROMO_SERVICE_LABELS[s]).join(", ") },
                { key: "uses", header: "Utilisations", align: "right", render: (p) => `${p.used} / ${p.maxUses}` },
                { key: "period", header: "Période", render: (p) => `${dayMonth(p.startsAt)} → ${dayMonth(p.endsAt)}` },
                { key: "funded", header: "Financé par", render: (p) => (p.fundedBy === "wami" ? "WAMI" : "Partagé avec le partenaire") },
                { key: "state", header: "État", render: (p) => <Tag tone={STATE[promoState(p, now)][0]}>{STATE[promoState(p, now)][1]}</Tag> },
                {
                  key: "active",
                  header: "",
                  render: (p) => (
                    <Toggle
                      checked={p.active}
                      label={`Activer ${p.code}`}
                      disabled={!canWrite || busy}
                      onChange={async () => {
                        const r = await run(() => promoCodesUseCases.toggle(p));
                        if (r) list.mutate((l) => l.map((x) => (x.code === r.code ? r : x)));
                      }}
                    />
                  ),
                },
              ]}
            />
          )}
        </ResourceView>
      </Card>
      {creating ? (
        <CreatePromoDialog
          existing={list.data ?? []}
          onClose={() => setCreating(false)}
          onDone={(p) => {
            list.mutate((l) => [p, ...l]);
            setCreating(false);
          }}
        />
      ) : null}
    </>
  );
}

function CreatePromoDialog({ existing, onClose, onDone }: { existing: PromoCode[]; onClose: () => void; onDone: (p: PromoCode) => void }) {
  const [p, setP] = useState<PromoCode>({
    code: "",
    description: "",
    kind: "percent",
    value: 20,
    cap: 1000,
    maxUses: 500,
    used: 0,
    services: ["ride"],
    startsAt: "",
    endsAt: "",
    fundedBy: "wami",
    firstOrderOnly: false,
    active: true,
  });
  const { busy, run } = useAction();
  const set = <K extends keyof PromoCode>(k: K, v: PromoCode[K]) => setP({ ...p, [k]: v });

  return (
    <Dialog
      open
      title="Nouveau code promo"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button
            tone="primary"
            busy={busy}
            onClick={async () => {
              const r = await run(() => promoCodesUseCases.create(p, existing), "Code promo créé.");
              if (r) onDone(r);
            }}
          >
            Créer
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Code">
          <input className={fieldClass} value={p.code} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="NOEL2026" />
        </Field>
        <Field label="Type">
          <Segmented
            label="Type de remise"
            value={p.kind}
            onChange={(k) => setP({ ...p, kind: k, cap: k === "fixed" ? null : (p.cap ?? 1000) })}
            options={[
              ["percent", "Pourcentage"],
              ["fixed", "Montant fixe"],
            ]}
          />
        </Field>
        <Field label={p.kind === "percent" ? "Remise (%)" : "Remise (F)"}>
          <input className={fieldClass} inputMode="numeric" value={p.value} onChange={(e) => set("value", Number(e.target.value.replace(/\D/g, "")))} />
        </Field>
        {p.kind === "percent" ? (
          <Field label="Plafond par utilisation (F)">
            <input className={fieldClass} inputMode="numeric" value={p.cap ?? ""} onChange={(e) => set("cap", e.target.value ? Number(e.target.value.replace(/\D/g, "")) : null)} />
          </Field>
        ) : (
          <span />
        )}
        <Field label="Utilisations maximum">
          <input className={fieldClass} inputMode="numeric" value={p.maxUses} onChange={(e) => set("maxUses", Number(e.target.value.replace(/\D/g, "")))} />
        </Field>
        <Field label="Financé par">
          <select className={fieldClass} value={p.fundedBy} onChange={(e) => set("fundedBy", e.target.value as PromoCode["fundedBy"])}>
            <option value="wami">WAMI</option>
            <option value="shared">Partagé avec le partenaire</option>
          </select>
        </Field>
        <Field label="Début">
          <input className={fieldClass} type="date" onChange={(e) => set("startsAt", e.target.value ? new Date(`${e.target.value}T00:00:00`).toISOString() : "")} />
        </Field>
        <Field label="Fin">
          <input className={fieldClass} type="date" onChange={(e) => set("endsAt", e.target.value ? new Date(`${e.target.value}T23:59:00`).toISOString() : "")} />
        </Field>
      </div>
      <fieldset className="flex flex-wrap gap-3 text-[13px]">
        <legend className="mb-1 text-[10.5px] font-bold uppercase tracking-wider text-muted">Services</legend>
        {(Object.keys(PROMO_SERVICE_LABELS) as PromoService[]).map((s) => (
          <label key={s} className="flex items-center gap-1.5">
            <input type="checkbox" checked={p.services.includes(s)} onChange={(e) => set("services", e.target.checked ? [...p.services, s] : p.services.filter((x) => x !== s))} />
            {PROMO_SERVICE_LABELS[s]}
          </label>
        ))}
      </fieldset>
      <label className="flex items-center gap-2 text-[13px]">
        <input type="checkbox" checked={p.firstOrderOnly} onChange={(e) => set("firstOrderOnly", e.target.checked)} />
        Première commande seulement
      </label>
    </Dialog>
  );
}
