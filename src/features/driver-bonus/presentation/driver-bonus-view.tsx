"use client";

import { useState } from "react";
import { useAction } from "@/shared/hooks/use-action";
import { useResource } from "@/shared/hooks/use-resource";
import { dateTime, fcfa } from "@/shared/lib/format";
import { useCanWrite } from "@/shared/ui/app-shell";
import { DataTable } from "@/shared/ui/data-table";
import { Button, Card, CardHeader, PageHeader, Segmented, Tag, Toggle } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { driverBonusUseCases } from "../application/driver-bonus.use-cases";
import { BonusConfigDialog } from "./bonus-config-dialog";
import { ChallengesPanel } from "./challenges-panel";
import { BONUS_FAMILY_LABELS, BONUS_LEDGER_LABELS, type BonusConfig, type BonusEntry, type BonusFamily, type BonusLedger, type BonusRunConfig } from "../domain/bonus";

type Tab = BonusFamily | "challenges";
const FAMILIES: ReadonlyArray<readonly [Tab, string]> = [...(Object.keys(BONUS_FAMILY_LABELS) as BonusFamily[]).map((f) => [f, BONUS_FAMILY_LABELS[f]] as const), ["challenges", "Défis (fictifs)"] as const];
const LEDGER_OF: Record<BonusFamily, BonusLedger[]> = { tier: ["awards"], activity: ["activityLedger", "activityPayouts"], quality: ["qualityLedger"] };

export function DriverBonusView() {
  const [family, setFamily] = useState<Tab>("tier");
  return (
    <>
      <PageHeader title="Primes chauffeurs">
        <div className="ml-auto">
          <Segmented label="Famille de primes" options={FAMILIES} value={family} onChange={setFamily} />
        </div>
      </PageHeader>
      {family === "challenges" ? (
        <ChallengesPanel />
      ) : (
        <>
          <Configs key={family} family={family} />
          {LEDGER_OF[family].map((l) => (
            <Ledger key={l} ledger={l} />
          ))}
          <RunConfig />
        </>
      )}
    </>
  );
}

function Configs({ family }: { family: BonusFamily }) {
  const configs = useResource(() => driverBonusUseCases.configs(family), family);
  const canWrite = useCanWrite("driver-bonus");
  const { busy, run } = useAction();
  const [editing, setEditing] = useState<BonusConfig | "new" | null>(null);
  return (
    <Card className="overflow-hidden">
      <CardHeader title={`Configurations · ${BONUS_FAMILY_LABELS[family]}`}>
        <Button size="sm" tone="primary" disabled={!canWrite} onClick={() => setEditing("new")}>
          Nouvelle
        </Button>
      </CardHeader>
      {editing ? (
        <BonusConfigDialog
          family={family}
          config={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onDone={() => {
            setEditing(null);
            configs.reload();
          }}
        />
      ) : null}
      <ResourceView state={configs} onRetry={configs.reload}>
        {(rows) => (
          <DataTable<BonusConfig>
            rows={rows}
            rowKey={(c) => c.id}
            empty="Aucune configuration : cette famille de primes est inactive."
            columns={[
              { key: "name", header: "Nom", render: (c) => <b>{c.name}</b> },
              { key: "cat", header: "Catégorie", render: (c) => c.vehicleCategory },
              { key: "rules", header: "Règles", render: (c) => <span className="whitespace-normal">{c.rules.join(" · ") || "—"}</span> },
              {
                key: "act",
                header: "",
                render: (c) => (
                  <span className="flex gap-1.5">
                    {c.active ? <Tag tone="ok">Active</Tag> : null}
                    <Button size="sm" disabled={!canWrite} onClick={() => setEditing(c)}>
                      Modifier
                    </Button>
                    <Button
                      size="sm"
                      disabled={!canWrite || busy}
                      onClick={async () => {
                        const r = await run(() => (c.active ? driverBonusUseCases.deactivate(c) : driverBonusUseCases.activate(c)), c.active ? "Configuration désactivée." : "Configuration activée.");
                        if (r !== undefined) configs.reload();
                      }}
                    >
                      {c.active ? "Désactiver" : "Activer"}
                    </Button>
                    {!c.active ? (
                      <Button
                        size="sm"
                        tone="danger"
                        disabled={!canWrite || busy}
                        onClick={async () => {
                          const r = await run(() => driverBonusUseCases.remove(c), "Configuration supprimée.");
                          if (r !== undefined) configs.reload();
                        }}
                      >
                        Supprimer
                      </Button>
                    ) : null}
                  </span>
                ),
              },
            ]}
          />
        )}
      </ResourceView>
    </Card>
  );
}

function Ledger({ ledger }: { ledger: BonusLedger }) {
  const entries = useResource(() => driverBonusUseCases.entries(ledger), ledger);
  return (
    <Card className="overflow-hidden">
      <CardHeader title={BONUS_LEDGER_LABELS[ledger]} />
      <ResourceView state={entries} onRetry={entries.reload}>
        {(rows) => (
          <DataTable<BonusEntry>
            rows={rows}
            rowKey={(e) => e.id}
            empty="Aucune ligne pour l’instant."
            columns={[
              { key: "date", header: "Date", render: (e) => (e.date ? dateTime(e.date) : "—") },
              { key: "driver", header: "Chauffeur", render: (e) => e.driverId },
              { key: "label", header: "Détail", render: (e) => e.label },
              { key: "amount", header: "Montant", align: "right", render: (e) => fcfa(e.amount) },
            ]}
          />
        )}
      </ResourceView>
    </Card>
  );
}

function RunConfig() {
  const cfg = useResource(() => driverBonusUseCases.runConfig(), "run");
  const canWrite = useCanWrite("driver-bonus");
  const { busy, run } = useAction();
  const toggle = async (c: BonusRunConfig, key: "welcomeBonusEnabled" | "activityBonusEnabled" | "qualityBonusEnabled") => {
    const next = { ...c, [key]: !c[key] };
    const r = await run(() => driverBonusUseCases.saveRunConfig(next), "Calendrier mis à jour.");
    if (r !== undefined) cfg.mutate(() => next);
  };
  return (
    <Card className="flex flex-col gap-2 px-4 py-3.5">
      <CardHeader title="Exécution des primes" />
      <ResourceView state={cfg} onRetry={cfg.reload}>
        {(c) => (
          <div className="flex flex-col gap-2">
            <Toggle checked={c.welcomeBonusEnabled} label="Bonus de bienvenue" disabled={!canWrite || busy} onChange={() => toggle(c, "welcomeBonusEnabled")} />
            <Toggle checked={c.activityBonusEnabled} label={`Primes d’activité (versement ${c.activityPayoutFrequency.toLowerCase()})`} disabled={!canWrite || busy} onChange={() => toggle(c, "activityBonusEnabled")} />
            <Toggle checked={c.qualityBonusEnabled} label="Primes qualité" disabled={!canWrite || busy} onChange={() => toggle(c, "qualityBonusEnabled")} />
          </div>
        )}
      </ResourceView>
    </Card>
  );
}
