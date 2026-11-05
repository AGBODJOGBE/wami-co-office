"use client";

import { useState } from "react";
import { useAction } from "@/shared/hooks/use-action";
import { useResource } from "@/shared/hooks/use-resource";
import { dayMonth, fcfa } from "@/shared/lib/format";
import { useCanWrite } from "@/shared/ui/app-shell";
import { DataTable } from "@/shared/ui/data-table";
import { Dialog } from "@/shared/ui/dialog";
import { Button, Card, Field, fieldClass, Note, PageHeader, Tag, type Tone } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { driverBonusUseCases } from "../application/driver-bonus.use-cases";
import { currentCost, maxCost, state, type Challenge, type ChallengeDraft, type ChallengeState } from "../domain/challenge";

const STATE: Record<ChallengeState, [Tone, string]> = {
  scheduled: ["neutral", "Programmé"],
  running: ["ok", "En cours"],
  ended: ["info", "Terminé"],
  archived: ["neutral", "Archivé"],
};

export function DriverBonusView() {
  const list = useResource(() => driverBonusUseCases.list(), "bonus");
  const [creating, setCreating] = useState(false);
  const { busy, run } = useAction();
  const canWrite = useCanWrite("driver-bonus");
  const [now] = useState(() => new Date());

  return (
    <>
      <PageHeader title="Primes chauffeurs">
        <Button tone="primary" className="ml-auto" disabled={!canWrite} onClick={() => setCreating(true)}>
          Nouveau challenge
        </Button>
      </PageHeader>
      <Card className="overflow-hidden">
        <ResourceView state={list} onRetry={list.reload}>
          {(rows) => (
            <DataTable<Challenge>
              rows={rows}
              rowKey={(c) => c.id}
              columns={[
                { key: "title", header: "Challenge", render: (c) => <b>{c.title}</b> },
                { key: "zone", header: "Zone", render: (c) => c.zone },
                { key: "goal", header: "Objectif", render: (c) => `${c.targetMissions} missions → ${fcfa(c.reward)}` },
                { key: "period", header: "Période", render: (c) => `${dayMonth(c.startsAt)} → ${dayMonth(c.endsAt)}` },
                { key: "part", header: "Atteint", align: "right", render: (c) => `${c.achievers} / ${c.participants}` },
                { key: "cost", header: "Coût / max", align: "right", render: (c) => `${fcfa(currentCost(c))} / ${fcfa(maxCost(c))}` },
                { key: "state", header: "État", render: (c) => <Tag tone={STATE[state(c, now)][0]}>{STATE[state(c, now)][1]}</Tag> },
                {
                  key: "act",
                  header: "",
                  render: (c) =>
                    !c.archived ? (
                      <Button
                        size="sm"
                        disabled={!canWrite || busy}
                        onClick={async () => {
                          const r = await run(() => driverBonusUseCases.archive(c), "Challenge archivé.");
                          if (r) list.mutate((l) => l.map((x) => (x.id === r.id ? r : x)));
                        }}
                      >
                        Archiver
                      </Button>
                    ) : null,
                },
              ]}
            />
          )}
        </ResourceView>
      </Card>
      <Note>Versement des primes : ajouté au prochain versement hebdomadaire du partenaire (à valider). Budget mensuel maximal : à valider.</Note>
      {creating ? (
        <CreateDialog
          onClose={() => setCreating(false)}
          onDone={(c) => {
            list.mutate((l) => [c, ...l]);
            setCreating(false);
          }}
        />
      ) : null}
    </>
  );
}

function CreateDialog({ onClose, onDone }: { onClose: () => void; onDone: (c: Challenge) => void }) {
  const [d, setD] = useState<ChallengeDraft>({ title: "", zone: "Cotonou centre", service: "ride", targetMissions: 30, reward: 5000, startsAt: "", endsAt: "" });
  const { busy, run } = useAction();
  const set = <K extends keyof ChallengeDraft>(k: K, v: ChallengeDraft[K]) => setD({ ...d, [k]: v });
  return (
    <Dialog
      open
      title="Nouveau challenge"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button
            tone="primary"
            busy={busy}
            onClick={async () => {
              const r = await run(() => driverBonusUseCases.create(d), "Challenge créé : les partenaires de la zone sont prévenus.");
              if (r) onDone(r);
            }}
          >
            Créer
          </Button>
        </>
      }
    >
      <Field label="Titre">
        <input className={fieldClass} value={d.title} onChange={(e) => set("title", e.target.value)} placeholder="Week-end des fêtes" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Service">
          <select className={fieldClass} value={d.service} onChange={(e) => set("service", e.target.value as ChallengeDraft["service"])}>
            <option value="ride">Courses</option>
            <option value="delivery">Livraisons</option>
            <option value="all">Tout</option>
          </select>
        </Field>
        <Field label="Zone">
          <input className={fieldClass} value={d.zone} onChange={(e) => set("zone", e.target.value)} />
        </Field>
        <Field label="Missions à faire">
          <input className={fieldClass} inputMode="numeric" value={d.targetMissions} onChange={(e) => set("targetMissions", Number(e.target.value.replace(/\D/g, "")))} />
        </Field>
        <Field label="Prime (F)">
          <input className={fieldClass} inputMode="numeric" value={d.reward} onChange={(e) => set("reward", Number(e.target.value.replace(/\D/g, "")))} />
        </Field>
        <Field label="Début">
          <input className={fieldClass} type="date" value={d.startsAt.slice(0, 10)} onChange={(e) => set("startsAt", e.target.value ? new Date(`${e.target.value}T00:00:00`).toISOString() : "")} />
        </Field>
        <Field label="Fin">
          <input className={fieldClass} type="date" value={d.endsAt.slice(0, 10)} onChange={(e) => set("endsAt", e.target.value ? new Date(`${e.target.value}T23:59:00`).toISOString() : "")} />
        </Field>
      </div>
    </Dialog>
  );
}
