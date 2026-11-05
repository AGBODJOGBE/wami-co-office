"use client";

import { useState } from "react";
import { useAction } from "@/shared/hooks/use-action";
import { useResource } from "@/shared/hooks/use-resource";
import { fcfa, percent } from "@/shared/lib/format";
import { useCanWrite } from "@/shared/ui/app-shell";
import { DataTable } from "@/shared/ui/data-table";
import { Dialog } from "@/shared/ui/dialog";
import { Button, Card, Field, fieldClass, Kpi, Note, PageHeader, Tag, type Tone } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { AffiliateConfigCard, CreateAffiliateDialog, SkipsPanel, StatementDialog } from "./affiliate-ops-panels";
import { affiliateUseCases } from "../application/affiliate.use-cases";
import { AFFILIATE_STATUS_LABELS, MIN_AFFILIATE_PAYOUT, type Affiliate, type SuspensionMode } from "../domain/affiliate";

const TONE: Record<Affiliate["status"], Tone> = { active: "ok", suspended: "warn", closed: "bad" };
type Action = "suspend" | "close" | "reopen" | "rate";

export function AffiliateView() {
  const list = useResource(() => affiliateUseCases.list(), "affiliates");
  const canWrite = useCanWrite("affiliate");
  const [dialog, setDialog] = useState<{ affiliate: Affiliate; action: Action } | null>(null);
  const [statementOf, setStatementOf] = useState<Affiliate | null>(null);
  const [creating, setCreating] = useState(false);
  const { busy, run } = useAction();

  return (
    <>
      <PageHeader title="Affiliation">
        <Button tone="primary" className="ml-auto" disabled={!canWrite} onClick={() => setCreating(true)}>
          Nouvel affilié
        </Button>
      </PageHeader>
      <AffiliateConfigCard />
      <ResourceView state={list} onRetry={list.reload}>
        {(rows) => (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Kpi label="Affiliés actifs" value={String(rows.filter((a) => a.status === "active").length)} />
              <Kpi label="Commissions gagnées" value={fcfa(rows.reduce((s, a) => s + a.accrued, 0))} />
              <Kpi label="Déjà versé" value={fcfa(rows.reduce((s, a) => s + a.paid, 0))} />
              <Kpi label="Reste à verser" value={fcfa(rows.reduce((s, a) => s + a.outstanding, 0))} />
            </div>
            <Card className="overflow-hidden">
              <DataTable<Affiliate>
                rows={rows}
                rowKey={(a) => a.id}
                columns={[
                  { key: "name", header: "Affilié", render: (a) => <b>{a.name}</b> },
                  { key: "net", header: "Réseau", render: (a) => a.socialNetwork || "—" },
                  { key: "codes", header: "Codes", render: (a) => a.codes.map((c) => `${c.code} (${c.usages})`).join(", ") || "—" },
                  { key: "rate", header: "Taux", align: "right", render: (a) => percent(a.effectiveCommissionRate, 1) },
                  { key: "accrued", header: "Gagné", align: "right", render: (a) => fcfa(a.accrued) },
                  { key: "due", header: "À verser", align: "right", render: (a) => <b>{fcfa(a.outstanding)}</b> },
                  { key: "status", header: "Statut", render: (a) => <Tag tone={TONE[a.status]}>{AFFILIATE_STATUS_LABELS[a.status]}</Tag> },
                  {
                    key: "act",
                    header: "",
                    render: (a) => (
                      <span className="flex gap-1.5">
                        {a.outstanding >= MIN_AFFILIATE_PAYOUT ? (
                          <Button
                            size="sm"
                            tone="primary"
                            disabled={!canWrite || busy}
                            title="Route backend manquante : faux backend"
                            onClick={async () => {
                              const r = await run(() => affiliateUseCases.pay(a, a.outstanding), `${fcfa(a.outstanding)} versés à ${a.name} (faux backend).`);
                              if (r !== undefined) list.reload();
                            }}
                          >
                            Verser {fcfa(a.outstanding)}
                          </Button>
                        ) : null}
                        <Button size="sm" onClick={() => setStatementOf(a)}>
                          Relevé
                        </Button>
                        <Button size="sm" disabled={!canWrite || a.status === "closed"} onClick={() => setDialog({ affiliate: a, action: "rate" })}>
                          Taux
                        </Button>
                        {a.status === "active" ? (
                          <Button size="sm" disabled={!canWrite} onClick={() => setDialog({ affiliate: a, action: "suspend" })}>
                            Suspendre
                          </Button>
                        ) : null}
                        {a.status === "suspended" ? (
                          <Button
                            size="sm"
                            disabled={!canWrite || busy}
                            onClick={async () => {
                              const r = await run(() => affiliateUseCases.reactivate(a), "Affilié réactivé.");
                              if (r !== undefined) list.reload();
                            }}
                          >
                            Réactiver
                          </Button>
                        ) : null}
                        {a.status === "closed" ? (
                          <Button size="sm" disabled={!canWrite} onClick={() => setDialog({ affiliate: a, action: "reopen" })}>
                            Rouvrir
                          </Button>
                        ) : (
                          <Button size="sm" tone="danger" disabled={!canWrite} onClick={() => setDialog({ affiliate: a, action: "close" })}>
                            Clôturer
                          </Button>
                        )}
                      </span>
                    ),
                  },
                ]}
              />
            </Card>
          </>
        )}
      </ResourceView>
      <SkipsPanel />
      {statementOf ? <StatementDialog affiliate={statementOf} onClose={() => setStatementOf(null)} /> : null}
      {creating ? (
        <CreateAffiliateDialog
          onClose={() => setCreating(false)}
          onDone={() => {
            setCreating(false);
            list.reload();
          }}
        />
      ) : null}
      <Note>Les commissions sont versées via une demande de retrait, à valider dans « Retraits ». Taux par défaut, conditions d’éligibilité et contrat d’apporteur : à valider.</Note>
      {dialog ? (
        <ActionDialog
          {...dialog}
          onClose={() => setDialog(null)}
          onDone={() => {
            setDialog(null);
            list.reload();
          }}
        />
      ) : null}
    </>
  );
}

const TITLES: Record<Action, string> = { suspend: "Suspendre", close: "Clôturer", reopen: "Rouvrir", rate: "Taux de commission" };

function ActionDialog({ affiliate, action, onClose, onDone }: { affiliate: Affiliate; action: Action; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState("");
  const [mode, setMode] = useState<SuspensionMode>("pause");
  const [rate, setRate] = useState(affiliate.commissionRate === null ? "" : String(Math.round(affiliate.commissionRate * 1000) / 10));
  const { busy, run } = useAction();

  const submit = async () => {
    const r = await run(() => {
      if (action === "suspend") return affiliateUseCases.suspend(affiliate, mode, reason);
      if (action === "close") return affiliateUseCases.close(affiliate, reason);
      if (action === "reopen") return affiliateUseCases.reopen(affiliate, reason);
      return affiliateUseCases.setCommissionRate(affiliate, rate.trim() === "" ? null : Number(rate.replace(",", ".")) / 100);
    }, "Enregistré.");
    if (r !== undefined) onDone();
  };

  return (
    <Dialog
      open
      title={`${TITLES[action]} · ${affiliate.name}`}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button tone={action === "close" ? "danger" : "primary"} busy={busy} onClick={submit}>
            Confirmer
          </Button>
        </>
      }
    >
      {action === "rate" ? (
        <Field label="Taux (%)" hint="Laissez vide pour revenir au taux par défaut.">
          <input className={fieldClass} inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value.replace(/[^\d.,]/g, ""))} />
        </Field>
      ) : (
        <>
          {action === "suspend" ? (
            <Field label="Type de suspension" hint="Pause : temporaire, sans faute. Sanction : motif obligatoire.">
              <select className={fieldClass} value={mode} onChange={(e) => setMode(e.target.value as SuspensionMode)}>
                <option value="pause">Pause</option>
                <option value="sanction">Sanction</option>
              </select>
            </Field>
          ) : null}
          <Field label="Motif">
            <input className={fieldClass} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
        </>
      )}
    </Dialog>
  );
}
