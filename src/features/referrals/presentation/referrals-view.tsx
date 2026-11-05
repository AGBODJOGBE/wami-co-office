"use client";

import { useAction } from "@/shared/hooks/use-action";
import { useResource } from "@/shared/hooks/use-resource";
import { dayMonth, fcfa } from "@/shared/lib/format";
import { useCanWrite } from "@/shared/ui/app-shell";
import { DataTable } from "@/shared/ui/data-table";
import { Button, Card, CardHeader, Kpi, Note, PageHeader, Tag, type Tone } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { referralsUseCases } from "../application/referrals.use-cases";
import { REFERRAL_STATUS_LABELS, type Referral, type ReferralConfig, type ReferralStatus } from "../domain/referral";

const TONE: Record<ReferralStatus, Tone> = { pending: "neutral", validated: "ok", expired: "bad" };

export function ReferralsView() {
  const stats = useResource(() => referralsUseCases.stats(), "stats");
  const configs = useResource(() => referralsUseCases.configs(), "configs");
  const list = useResource(() => referralsUseCases.list(), "referrals");
  const canWrite = useCanWrite("referrals");
  const { busy, run } = useAction();

  const refresh = () => {
    list.reload();
    stats.reload();
  };

  return (
    <>
      <PageHeader title="Parrainage" />
      <ResourceView state={stats} onRetry={stats.reload}>
        {(s) => (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <Kpi label="Parrainages" value={String(s.total)} />
            <Kpi label="Validés" value={String(s.validated)} />
            <Kpi label="En attente" value={String(s.pending)} />
            <Kpi label="Expirés" value={String(s.expired)} />
            <Kpi label="Récompenses versées" value={fcfa(s.totalRewards)} />
          </div>
        )}
      </ResourceView>
      <div className="grid gap-3.5 xl:grid-cols-[400px_minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <CardHeader title="Configurations" />
          <ResourceView state={configs} onRetry={configs.reload}>
            {(rows) => (
              <DataTable<ReferralConfig>
                rows={rows}
                rowKey={(c) => c.id}
                empty="Aucune configuration : le parrainage est inactif."
                columns={[
                  { key: "name", header: "Nom", render: (c) => <b>{c.name}</b> },
                  { key: "rules", header: "Règles", align: "right", render: (c) => String(c.rules.length) },
                  { key: "exp", header: "Expire", align: "right", render: (c) => (c.expirationDays === null ? "jamais" : `${c.expirationDays} j`) },
                  {
                    key: "act",
                    header: "",
                    render: (c) => (
                      <span className="flex gap-1.5">
                        {c.active ? <Tag tone="ok">Active</Tag> : null}
                        <Button
                          size="sm"
                          disabled={!canWrite || busy}
                          onClick={async () => {
                            const r = await run(() => (c.active ? referralsUseCases.deactivate(c) : referralsUseCases.activate(c)), c.active ? "Configuration désactivée." : "Configuration activée.");
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
                              const r = await run(() => referralsUseCases.remove(c), "Configuration supprimée.");
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
        <Card className="overflow-hidden">
          <CardHeader title="Parrainages récents" />
          <ResourceView state={list} onRetry={list.reload}>
            {(rows) => (
              <DataTable<Referral>
                rows={rows}
                rowKey={(r) => r.id}
                columns={[
                  { key: "code", header: "Code", render: (r) => r.code },
                  { key: "type", header: "Profil invité", render: (r) => r.type },
                  { key: "date", header: "Date", render: (r) => dayMonth(r.createdAt) },
                  { key: "rew", header: "Récompenses", align: "right", render: (r) => `${fcfa(r.referrerReward)} / ${fcfa(r.refereeReward)}` },
                  { key: "status", header: "État", render: (r) => <Tag tone={TONE[r.status]}>{REFERRAL_STATUS_LABELS[r.status]}</Tag> },
                  {
                    key: "act",
                    header: "",
                    render: (r) =>
                      r.status === "pending" ? (
                        <span className="flex gap-1.5">
                          <Button
                            size="sm"
                            tone="primary"
                            disabled={!canWrite || busy}
                            onClick={async () => {
                              const u = await run(() => referralsUseCases.validate(r), "Parrainage validé : les récompenses sont versées.");
                              if (u !== undefined) refresh();
                            }}
                          >
                            Valider
                          </Button>
                          <Button
                            size="sm"
                            tone="danger"
                            disabled={!canWrite || busy}
                            onClick={async () => {
                              const u = await run(() => referralsUseCases.expire(r), "Parrainage expiré : aucune récompense ne sera versée.");
                              if (u !== undefined) refresh();
                            }}
                          >
                            Faire expirer
                          </Button>
                        </span>
                      ) : null,
                  },
                ]}
              />
            )}
          </ResourceView>
        </Card>
      </div>
      <Note>La création et la modification d’une configuration (matrice de récompenses, limites, conditions) arrivent dans un prochain écran ; l’activation est déjà possible ici.</Note>
    </>
  );
}
