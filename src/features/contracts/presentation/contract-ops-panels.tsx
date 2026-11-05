"use client";

import { useState } from "react";
import { useAction } from "@/shared/hooks/use-action";
import { useResource } from "@/shared/hooks/use-resource";
import { dateTime, dayMonth, fcfa } from "@/shared/lib/format";
import { useCanWrite } from "@/shared/ui/app-shell";
import { DataTable } from "@/shared/ui/data-table";
import { Button, Card, CardHeader, Field, fieldClass, Kpi, Note, Segmented, Tag } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { contractOpsUseCases } from "../application/contract-ops.use-cases";
import { alertReasonLabel, auditActionLabel, type AuditLine, type RevenueShareAlert, type Withholding } from "../domain/contract-ops";
import type { LeaseContract } from "../domain/lease-contract";

/** Indicateurs globaux de la flotte en location-vente. */
export function FleetKpisRow() {
  const kpis = useResource(() => contractOpsUseCases.kpis(), "kpis");
  return (
    <ResourceView state={kpis} onRetry={kpis.reload}>
      {(k) => (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi label="Contrats (actifs / total)" value={`${k.contracts.active} / ${k.contracts.total}`} hint={`${k.contracts.suspended} suspendus · ${k.contracts.broken} rompus`} />
          <Kpi label="Échéances en retard" value={String(k.overdueInstallments)} hint={`${k.atRisk} chauffeurs à risque · ${k.blocked} bloqués (seuil ${k.blockThreshold})`} />
          <Kpi label="Encaissé" value={fcfa(k.paid)} />
          <Kpi label="Reste à encaisser" value={fcfa(k.remaining)} hint={`dette résiduelle ${fcfa(k.residualDebt)}`} />
        </div>
      )}
    </ResourceView>
  );
}

const TABS = [["alerts", "Alertes"], ["audit", "Journal d’audit"]] as const;

/** Alertes de prélèvement sur les revenus et journal d'audit des contrats. */
export function ContractMonitoring() {
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("alerts");
  return (
    <Card className="overflow-hidden">
      <CardHeader title="Suivi des contrats">
        <Segmented label="Section" options={TABS} value={tab} onChange={setTab} />
      </CardHeader>
      {tab === "alerts" ? <Alerts /> : <Audit />}
    </Card>
  );
}

function Alerts() {
  const alerts = useResource(() => contractOpsUseCases.alerts(), "alerts");
  return (
    <ResourceView state={alerts} onRetry={alerts.reload}>
      {(rows) => (
        <DataTable<RevenueShareAlert>
          rows={rows}
          rowKey={(a) => a.contractId}
          empty="Aucune alerte."
          columns={[
            { key: "c", header: "Contrat", render: (a) => <code className="text-xs">{a.contractId}</code> },
            { key: "r", header: "Reste dû", align: "right", render: (a) => fcfa(a.remaining) },
            { key: "u", header: "Non reconnu", align: "right", render: (a) => fcfa(a.unrecognized) },
            { key: "l", header: "Dernier prélèvement", render: (a) => (a.lastWithholdingAt ? dayMonth(a.lastWithholdingAt) : "jamais") },
            { key: "w", header: "Alerte", render: (a) => a.reasons.map((r) => <Tag key={r} tone="warn">{alertReasonLabel(r)}</Tag>) },
          ]}
        />
      )}
    </ResourceView>
  );
}

function Audit() {
  const audit = useResource(() => contractOpsUseCases.audit(), "audit");
  return (
    <ResourceView state={audit} onRetry={audit.reload}>
      {(rows) => (
        <DataTable<AuditLine>
          rows={rows}
          rowKey={(a) => a.id}
          empty="Aucun événement."
          columns={[
            { key: "d", header: "Quand", render: (a) => dateTime(a.at) },
            { key: "a", header: "Action", render: (a) => auditActionLabel(a.action) },
            { key: "c", header: "Contrat", render: (a) => (a.contractId ? <code className="text-xs">{a.contractId}</code> : "—") },
            { key: "b", header: "Par", render: (a) => a.by },
            { key: "x", header: "Détails", render: (a) => <span className="whitespace-normal text-xs text-muted">{a.details || "—"}</span> },
          ]}
        />
      )}
    </ResourceView>
  );
}

/** Prélèvement sur les revenus d'un contrat : passage de mode, taux, historique, déblocage du chauffeur. */
export function RepaymentPanel({ contract, threshold, onChanged }: { contract: LeaseContract; threshold: number; onChanged: () => void }) {
  const canWrite = useCanWrite("contracts");
  const { busy, run } = useAction();
  const [rate, setRate] = useState("20");
  const [confirming, setConfirming] = useState(false);
  const share = contract.repaymentMode === "revenueShare";
  const asFraction = () => Number(rate.replace(",", ".")) / 100;
  const withholdings = useResource(() => (share ? contractOpsUseCases.withholdings(contract.id) : Promise.resolve({ ok: true as const, value: [] as Withholding[] })), `${contract.id}-${share}`);

  return (
    <div className="mt-2 flex flex-col gap-2 border-t border-field pt-2">
      <b className="text-sm">Mode de remboursement</b>
      {share ? (
        <>
          <Field label="Taux prélevé sur chaque revenu net (%)">
            <span className="flex gap-2">
              <input className={fieldClass} inputMode="decimal" disabled={!canWrite} value={rate} onChange={(e) => setRate(e.target.value.replace(/[^\d.,]/g, ""))} />
              <Button
                disabled={!canWrite}
                busy={busy}
                onClick={async () => {
                  const r = await run(() => contractOpsUseCases.updateRate(contract, asFraction()), "Taux modifié.");
                  if (r !== undefined) onChanged();
                }}
              >
                Modifier
              </Button>
            </span>
          </Field>
          <ResourceView state={withholdings} onRetry={withholdings.reload}>
            {(rows) => (
              <DataTable<Withholding>
                rows={rows}
                rowKey={(w) => w.id}
                empty="Aucun prélèvement pour l’instant."
                columns={[
                  { key: "d", header: "Date", render: (w) => dayMonth(w.date) },
                  { key: "s", header: "Origine", render: (w) => w.source },
                  { key: "a", header: "Prélevé", align: "right", render: (w) => fcfa(w.amount) },
                ]}
              />
            )}
          </ResourceView>
        </>
      ) : confirming ? (
        <div className="flex flex-col gap-2 rounded-[10px] border border-warn p-3">
          <Note>
            Passage définitif en prélèvement sur les revenus : l’échéancier est annulé et le chauffeur est débloqué s’il l’était. À valider avec WAMI-CO.
          </Note>
          <Field label="Taux prélevé (%)">
            <input className={fieldClass} inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value.replace(/[^\d.,]/g, ""))} />
          </Field>
          <span className="flex gap-2">
            <Button onClick={() => setConfirming(false)}>Retour</Button>
            <Button
              tone="danger"
              busy={busy}
              onClick={async () => {
                const r = await run(() => contractOpsUseCases.switchToRevenueShare(contract, asFraction()), "Contrat passé en prélèvement sur les revenus.");
                if (r !== undefined) onChanged();
              }}
            >
              Confirmer le passage
            </Button>
          </span>
        </div>
      ) : (
        <Button className="self-start" disabled={!canWrite || (contract.status !== "active" && contract.status !== "suspended")} onClick={() => setConfirming(true)}>
          Passer en prélèvement sur les revenus…
        </Button>
      )}
      {contract.unpaidCount >= threshold && contract.status !== "completed" && contract.status !== "broken" ? (
        <Button
          className="self-start"
          disabled={!canWrite}
          busy={busy}
          onClick={async () => {
            const r = await run(() => contractOpsUseCases.unblockDriver(contract, threshold), "Chauffeur débloqué.");
            if (r !== undefined) onChanged();
          }}
        >
          Débloquer le chauffeur
        </Button>
      ) : null}
    </div>
  );
}
