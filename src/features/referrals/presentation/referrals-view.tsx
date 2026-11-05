"use client";

import { useState } from "react";
import { useAction } from "@/shared/hooks/use-action";
import { useResource } from "@/shared/hooks/use-resource";
import { dayMonth } from "@/shared/lib/format";
import { useCanWrite } from "@/shared/ui/app-shell";
import { DataTable } from "@/shared/ui/data-table";
import { Button, Card, CardHeader, Field, fieldClass, PageHeader, Tag, Toggle } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { referralsUseCases } from "../application/referrals.use-cases";
import { isEligible, type Referral, type ReferralProgram } from "../domain/referral";

export function ReferralsView() {
  const program = useResource(() => referralsUseCases.program(), "program");
  const list = useResource(() => referralsUseCases.list(), "referrals");
  const canWrite = useCanWrite("referrals");
  const { busy, run } = useAction();

  return (
    <>
      <PageHeader title="Parrainage clients" />
      <div className="grid gap-3.5 xl:grid-cols-[340px_minmax(0,1fr)]">
        <ResourceView state={program} onRetry={program.reload}>
          {(p) => <ProgramCard initial={p} canWrite={canWrite} onSaved={(np) => program.mutate(() => np)} />}
        </ResourceView>
        <Card className="overflow-hidden">
          <CardHeader title="Parrainages récents" />
          <ResourceView state={list} onRetry={list.reload}>
            {(rows) => (
              <DataTable<Referral>
                rows={rows}
                rowKey={(r) => r.id}
                columns={[
                  { key: "who", header: "Parrain → filleul", render: (r) => `${r.referrerName} → ${r.refereeName}` },
                  { key: "date", header: "Date", render: (r) => dayMonth(r.createdAt) },
                  { key: "missions", header: "Missions du filleul", align: "right", render: (r) => String(r.missionsDone) },
                  {
                    key: "status",
                    header: "État",
                    render: (r) =>
                      r.status === "flagged" ? (
                        <Tag tone="bad">Bloqué</Tag>
                      ) : r.status === "rewarded" ? (
                        <Tag tone="ok">Récompensé</Tag>
                      ) : program.data && isEligible(r, program.data) ? (
                        <Tag tone="info">Éligible</Tag>
                      ) : (
                        <Tag>En attente</Tag>
                      ),
                  },
                  { key: "susp", header: "Alerte fraude", render: (r) => (r.suspicion ? <span className="text-bad">{r.suspicion}</span> : "—") },
                  {
                    key: "act",
                    header: "",
                    render: (r) =>
                      r.status === "pending" ? (
                        <Button
                          size="sm"
                          tone="danger"
                          disabled={!canWrite || busy}
                          onClick={async () => {
                            const u = await run(() => referralsUseCases.flag(r), "Parrainage bloqué : aucune récompense ne sera versée.");
                            if (u) list.mutate((l) => l.map((x) => (x.id === u.id ? u : x)));
                          }}
                        >
                          Bloquer
                        </Button>
                      ) : null,
                  },
                ]}
              />
            )}
          </ResourceView>
        </Card>
      </div>
    </>
  );
}

function ProgramCard({ initial, canWrite, onSaved }: { initial: ReferralProgram; canWrite: boolean; onSaved: (p: ReferralProgram) => void }) {
  const [p, setP] = useState(initial);
  const { busy, run } = useAction();
  return (
    <Card className="flex flex-col gap-3 px-4 py-3.5">
      <div className="flex items-center justify-between">
        <b className="text-sm">Programme</b>
        <Toggle checked={p.active} onChange={(v) => setP({ ...p, active: v })} label="Programme actif" disabled={!canWrite} />
      </div>
      <Field label="Récompense du parrain (F)">
        <input className={fieldClass} inputMode="numeric" disabled={!canWrite} value={p.referrerReward} onChange={(e) => setP({ ...p, referrerReward: Number(e.target.value.replace(/\D/g, "")) })} />
      </Field>
      <Field label="Récompense du filleul (F)">
        <input className={fieldClass} inputMode="numeric" disabled={!canWrite} value={p.refereeReward} onChange={(e) => setP({ ...p, refereeReward: Number(e.target.value.replace(/\D/g, "")) })} />
      </Field>
      <Field label="Missions à faire par le filleul">
        <input className={fieldClass} inputMode="numeric" disabled={!canWrite} value={p.requiredMissions} onChange={(e) => setP({ ...p, requiredMissions: Number(e.target.value.replace(/\D/g, "")) })} />
      </Field>
      <Button
        tone="primary"
        busy={busy}
        disabled={!canWrite}
        onClick={async () => {
          const r = await run(() => referralsUseCases.saveProgram(p), "Programme mis à jour.");
          if (r) onSaved(r);
        }}
      >
        Enregistrer
      </Button>
    </Card>
  );
}
