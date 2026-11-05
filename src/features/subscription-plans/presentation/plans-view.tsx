"use client";

import { useState } from "react";
import { useAction } from "@/shared/hooks/use-action";
import { useResource } from "@/shared/hooks/use-resource";
import { fcfa } from "@/shared/lib/format";
import { useCanWrite } from "@/shared/ui/app-shell";
import { DataTable } from "@/shared/ui/data-table";
import { Dialog } from "@/shared/ui/dialog";
import { Button, Card, Field, fieldClass, Note, PageHeader, Tag } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { plansUseCases } from "../application/plans.use-cases";
import { QUOTA_POLICY_LABELS, emptyPlan, pricePerDelivery, type Plan, type PlanDraft, type QuotaPolicy } from "../domain/plan";

export function PlansView() {
  const plans = useResource(() => plansUseCases.list(), "plans");
  const canWrite = useCanWrite("subscription-plans");
  const { busy, run } = useAction();
  const [editing, setEditing] = useState<Plan | "new" | null>(null);

  return (
    <>
      <PageHeader title="Plans d’abonnement livraison">
        <Button tone="primary" className="ml-auto" disabled={!canWrite} onClick={() => setEditing("new")}>
          Nouveau plan
        </Button>
      </PageHeader>
      <Card className="overflow-hidden">
        <ResourceView state={plans} onRetry={plans.reload}>
          {(rows) => (
            <DataTable<Plan>
              rows={rows}
              rowKey={(p) => p.id}
              empty="Aucun plan."
              columns={[
                { key: "n", header: "Plan", render: (p) => <span className="flex flex-col"><b>{p.name}</b>{p.description ? <span className="text-xs text-muted">{p.description}</span> : null}</span> },
                { key: "d", header: "Durée", align: "right", render: (p) => `${p.durationDays} j` },
                { key: "q", header: "Livraisons incluses", align: "right", render: (p) => (p.quota === null ? "Illimitées" : String(p.quota)) },
                { key: "pr", header: "Prix", align: "right", render: (p) => <b>{fcfa(p.price)}</b> },
                { key: "u", header: "Par livraison", align: "right", render: (p) => (pricePerDelivery(p) === null ? "—" : fcfa(pricePerDelivery(p)!)) },
                { key: "o", header: "Quota épuisé", render: (p) => QUOTA_POLICY_LABELS[p.onQuotaExhausted] ?? p.onQuotaExhausted },
                {
                  key: "a",
                  header: "",
                  render: (p) => (
                    <span className="flex gap-1.5">
                      {p.active ? null : <Tag tone="warn">Désactivé</Tag>}
                      <Button size="sm" disabled={!canWrite} onClick={() => setEditing(p)}>
                        Modifier
                      </Button>
                      <Button
                        size="sm"
                        disabled={!canWrite || busy}
                        onClick={async () => {
                          const r = await run(() => (p.active ? plansUseCases.deactivate(p) : plansUseCases.reactivate(p)), p.active ? "Plan désactivé : les abonnements en cours continuent." : "Plan réactivé.");
                          if (r !== undefined) plans.reload();
                        }}
                      >
                        {p.active ? "Désactiver" : "Réactiver"}
                      </Button>
                    </span>
                  ),
                },
              ]}
            />
          )}
        </ResourceView>
      </Card>
      <Note>Modifier ou désactiver un plan ne change pas les abonnements déjà souscrits : ils gardent les conditions vendues. Les prix s’affichent en FCFA ; le backend les stocke en centimes.</Note>
      {editing ? (
        <PlanDialog
          plan={editing === "new" ? null : editing}
          existing={plans.data ?? []}
          onClose={() => setEditing(null)}
          onDone={() => {
            setEditing(null);
            plans.reload();
          }}
        />
      ) : null}
    </>
  );
}

function PlanDialog({ plan, existing, onClose, onDone }: { plan: Plan | null; existing: Plan[]; onClose: () => void; onDone: () => void }) {
  const [d, setD] = useState<PlanDraft>(plan ? { name: plan.name, description: plan.description, durationDays: plan.durationDays, quota: plan.quota, onQuotaExhausted: plan.onQuotaExhausted, price: plan.price } : emptyPlan());
  const { busy, run } = useAction();
  return (
    <Dialog
      open
      title={plan ? `Modifier « ${plan.name} »` : "Nouveau plan"}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button
            tone="primary"
            busy={busy}
            onClick={async () => {
              const r = await run(() => (plan ? plansUseCases.update(plan, d, existing) : plansUseCases.create(d, existing)), plan ? "Plan modifié." : "Plan créé.");
              if (r !== undefined) onDone();
            }}
          >
            Enregistrer
          </Button>
        </>
      }
    >
      <Field label="Nom">
        <input className={fieldClass} value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} />
      </Field>
      <Field label="Description">
        <input className={fieldClass} value={d.description ?? ""} onChange={(e) => setD({ ...d, description: e.target.value })} />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Durée (jours)">
          <input className={fieldClass} inputMode="numeric" value={d.durationDays} onChange={(e) => setD({ ...d, durationDays: Number(e.target.value.replace(/\D/g, "")) })} />
        </Field>
        <Field label="Livraisons incluses" hint="Vide = illimitées.">
          <input className={fieldClass} inputMode="numeric" value={d.quota ?? ""} onChange={(e) => setD({ ...d, quota: e.target.value === "" ? null : Number(e.target.value.replace(/\D/g, "")) })} />
        </Field>
        <Field label="Prix (F)">
          <input className={fieldClass} inputMode="numeric" value={d.price} onChange={(e) => setD({ ...d, price: Number(e.target.value.replace(/\D/g, "")) })} />
        </Field>
      </div>
      <Field label="Quand le quota est épuisé">
        <select className={fieldClass} value={d.onQuotaExhausted} onChange={(e) => setD({ ...d, onQuotaExhausted: e.target.value as QuotaPolicy })}>
          {(Object.keys(QUOTA_POLICY_LABELS) as QuotaPolicy[]).map((k) => (
            <option key={k} value={k}>
              {QUOTA_POLICY_LABELS[k]}
            </option>
          ))}
        </select>
      </Field>
    </Dialog>
  );
}
