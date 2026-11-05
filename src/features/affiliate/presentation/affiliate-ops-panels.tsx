"use client";

import { useState } from "react";
import { useAction } from "@/shared/hooks/use-action";
import { useResource } from "@/shared/hooks/use-resource";
import { dayMonth, fcfa, percent } from "@/shared/lib/format";
import { useCanWrite } from "@/shared/ui/app-shell";
import { DataTable } from "@/shared/ui/data-table";
import { Dialog } from "@/shared/ui/dialog";
import { Button, Card, CardHeader, Field, fieldClass, InfoRow, Kpi, Note, Tag } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { affiliateOpsUseCases } from "../application/affiliate-ops.use-cases";
import { ELIGIBILITY_LABELS, skipReasonLabel, type AffiliateConfig, type CommissionLine, type CommissionSkip, type EligibilityResult, type NewAffiliate } from "../domain/affiliate-ops";
import type { Affiliate } from "../domain/affiliate";

/** Taux par défaut et montant minimum de retrait des affiliés. */
export function AffiliateConfigCard() {
  const config = useResource(() => affiliateOpsUseCases.config(), "affiliate-config");
  return (
    <ResourceView state={config} onRetry={config.reload}>
      {(c) => <ConfigForm initial={c} />}
    </ResourceView>
  );
}

function ConfigForm({ initial }: { initial: AffiliateConfig }) {
  const [rate, setRate] = useState(String(Math.round(initial.defaultCommissionRate * 1000) / 10));
  const [min, setMin] = useState(String(initial.minPayoutAmount));
  const canWrite = useCanWrite("affiliate");
  const { busy, run } = useAction();
  return (
    <Card className="flex flex-wrap items-end gap-3 px-4 py-3.5">
      <b className="w-full text-sm">Règles générales</b>
      <Field label="Taux de commission par défaut (%)">
        <input className={`${fieldClass} w-40`} inputMode="decimal" disabled={!canWrite} value={rate} onChange={(e) => setRate(e.target.value.replace(/[^\d.,]/g, ""))} />
      </Field>
      <Field label="Retrait minimum (F)">
        <input className={`${fieldClass} w-40`} inputMode="numeric" disabled={!canWrite} value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} />
      </Field>
      <Button
        tone="primary"
        disabled={!canWrite}
        busy={busy}
        onClick={async () => {
          await run(() => affiliateOpsUseCases.saveConfig({ defaultCommissionRate: Number(rate.replace(",", ".")) / 100, minPayoutAmount: Number(min) }), "Règles enregistrées.");
        }}
      >
        Enregistrer
      </Button>
    </Card>
  );
}

/** Création d'un profil d'affilié : vérification du numéro, puis création. */
export function CreateAffiliateDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [a, setA] = useState<NewAffiliate>({ phoneNumber: "", name: "", socialNetwork: "", audienceSize: null, commissionRate: null });
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null);
  const { busy, run } = useAction();
  return (
    <Dialog
      open
      title="Nouvel affilié"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button
            tone="primary"
            busy={busy}
            onClick={async () => {
              const r = await run(() => affiliateOpsUseCases.create(a, eligibility), "Profil d’affilié créé.");
              if (r !== undefined) onDone();
            }}
          >
            Créer
          </Button>
        </>
      }
    >
      <Field label="Téléphone" hint="La personne doit avoir un compte passager WAMI.">
        <span className="flex gap-2">
          <input className={fieldClass} type="tel" value={a.phoneNumber} onChange={(e) => { setA({ ...a, phoneNumber: e.target.value }); setEligibility(null); }} />
          <Button
            busy={busy}
            onClick={async () => {
              const r = await run(() => affiliateOpsUseCases.eligibility(a.phoneNumber));
              if (r) {
                setEligibility(r);
                if (r.displayName && !a.name) setA((x) => ({ ...x, name: r.displayName ?? "" }));
              }
            }}
          >
            Vérifier
          </Button>
        </span>
      </Field>
      {eligibility ? <Tag tone={eligibility.status === "eligible" ? "ok" : "bad"}>{eligibility.status === "eligible" ? `Éligible${eligibility.displayName ? ` : ${eligibility.displayName}` : ""}` : ELIGIBILITY_LABELS[eligibility.status]}</Tag> : null}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nom affiché">
          <input className={fieldClass} value={a.name} onChange={(e) => setA({ ...a, name: e.target.value })} />
        </Field>
        <Field label="Réseau social">
          <input className={fieldClass} value={a.socialNetwork} onChange={(e) => setA({ ...a, socialNetwork: e.target.value })} placeholder="Instagram, TikTok…" />
        </Field>
        <Field label="Audience (abonnés)" hint="Facultatif.">
          <input className={fieldClass} inputMode="numeric" value={a.audienceSize ?? ""} onChange={(e) => setA({ ...a, audienceSize: e.target.value === "" ? null : Number(e.target.value.replace(/\D/g, "")) })} />
        </Field>
        <Field label="Taux négocié (%)" hint="Vide = taux par défaut.">
          <input className={fieldClass} inputMode="decimal" value={a.commissionRate === null ? "" : Math.round(a.commissionRate * 1000) / 10} onChange={(e) => setA({ ...a, commissionRate: e.target.value === "" ? null : Number(e.target.value.replace(",", ".")) / 100 })} />
        </Field>
      </div>
    </Dialog>
  );
}

/** Relevé des commissions d'un affilié, avec retenue, libération et annulation d'une commission. */
export function StatementDialog({ affiliate, onClose }: { affiliate: Affiliate; onClose: () => void }) {
  const statement = useResource(() => affiliateOpsUseCases.statement(affiliate.id), affiliate.id);
  const canWrite = useCanWrite("affiliate");
  const { busy, run } = useAction();
  const [pending, setPending] = useState<{ line: CommissionLine; action: "hold" | "cancel" } | null>(null);
  const [reason, setReason] = useState("");

  const confirm = async () => {
    if (!pending) return;
    const { line, action } = pending;
    const r = await run(() => (action === "hold" ? affiliateOpsUseCases.hold(line, reason) : affiliateOpsUseCases.cancel(line, reason)), action === "hold" ? "Commission retenue." : "Commission annulée.");
    if (r !== undefined) {
      setPending(null);
      setReason("");
      statement.reload();
    }
  };

  return (
    <Dialog open title={`Relevé · ${affiliate.name}`} onClose={onClose} footer={<Button onClick={onClose}>Fermer</Button>}>
      <ResourceView state={statement} onRetry={statement.reload}>
        {(s) => (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Kpi label="Gagné" value={fcfa(s.totalAccrued)} />
              <Kpi label="Versé" value={fcfa(s.totalPaid)} />
              <Kpi label="Reste à verser" value={fcfa(s.outstanding)} hint={s.heldOutstanding ? `dont ${fcfa(s.heldOutstanding)} retenus` : undefined} />
              <Kpi label="Solde affilié" value={s.walletBalance === null ? "—" : fcfa(s.walletBalance)} />
            </div>
            {s.suspensionReason ? <InfoRow label="Motif de suspension">{s.suspensionReason}</InfoRow> : null}
            <DataTable<CommissionLine>
              rows={s.lines}
              rowKey={(l) => l.id}
              empty="Aucune commission."
              columns={[
                { key: "d", header: "Date", render: (l) => dayMonth(l.accruedAt) },
                { key: "s", header: "Origine", render: (l) => l.source },
                { key: "r", header: "Taux", align: "right", render: (l) => percent(l.rate, 1) },
                { key: "a", header: "Montant", align: "right", render: (l) => fcfa(l.amount) },
                { key: "o", header: "À verser", align: "right", render: (l) => fcfa(l.outstanding) },
                { key: "st", header: "Statut", render: (l) => <span className="flex gap-1">{l.status}{l.held ? <Tag tone="warn">Retenue</Tag> : null}</span> },
                {
                  key: "act",
                  header: "",
                  render: (l) => (
                    <span className="flex gap-1.5">
                      {l.held ? (
                        <Button
                          size="sm"
                          disabled={!canWrite || busy}
                          onClick={async () => {
                            const r = await run(() => affiliateOpsUseCases.release(l), "Commission libérée.");
                            if (r !== undefined) statement.reload();
                          }}
                        >
                          Libérer
                        </Button>
                      ) : (
                        <Button size="sm" disabled={!canWrite || busy} onClick={() => setPending({ line: l, action: "hold" })}>
                          Retenir
                        </Button>
                      )}
                      <Button size="sm" tone="danger" disabled={!canWrite || busy} onClick={() => setPending({ line: l, action: "cancel" })}>
                        Annuler
                      </Button>
                    </span>
                  ),
                },
              ]}
            />
            {pending ? (
              <div className="flex flex-col gap-2 rounded-[10px] border border-line p-3">
                <Field label={pending.action === "hold" ? "Motif de la retenue" : "Motif de l’annulation"}>
                  <input className={fieldClass} value={reason} onChange={(e) => setReason(e.target.value)} />
                </Field>
                <span className="flex gap-2">
                  <Button onClick={() => setPending(null)}>Retour</Button>
                  <Button tone={pending.action === "cancel" ? "danger" : "primary"} busy={busy} onClick={confirm}>
                    Confirmer
                  </Button>
                </span>
              </div>
            ) : null}
          </>
        )}
      </ResourceView>
    </Dialog>
  );
}

/** Commissions qui n'ont pas pu être créées (marge négative, taux nul…) : à examiner. */
export function SkipsPanel() {
  const skips = useResource(() => affiliateOpsUseCases.skips(), "skips");
  return (
    <Card className="overflow-hidden">
      <CardHeader title="Commissions non créées" />
      <ResourceView state={skips} onRetry={skips.reload}>
        {(rows) => (
          <DataTable<CommissionSkip>
            rows={rows}
            rowKey={(s) => s.id}
            empty="Aucune commission ignorée."
            columns={[
              { key: "d", header: "Date", render: (s) => dayMonth(s.appliedAt) },
              { key: "a", header: "Affilié", render: (s) => <code className="text-xs">{s.affiliateId}</code> },
              { key: "r", header: "Raison", render: (s) => skipReasonLabel(s.reason) },
              { key: "p", header: "Commission plateforme", align: "right", render: (s) => fcfa(s.platformCommission) },
              { key: "pot", header: "Montant potentiel", align: "right", render: (s) => (s.potential === null ? "—" : fcfa(s.potential)) },
              { key: "s", header: "", render: (s) => (s.resolved ? <Tag tone="ok">Résolue</Tag> : <Tag tone="warn">À examiner</Tag>) },
            ]}
          />
        )}
      </ResourceView>
      <Note className="m-4">Une commission est ignorée quand la marge de la plateforme ne la permet pas (garde-fou) ; elle apparaît ici pour décision.</Note>
    </Card>
  );
}
