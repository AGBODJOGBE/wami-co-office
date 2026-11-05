"use client";

import { useState } from "react";
import { useAction } from "@/shared/hooks/use-action";
import { useResource } from "@/shared/hooks/use-resource";
import { dayMonth, percent } from "@/shared/lib/format";
import { useCanWrite } from "@/shared/ui/app-shell";
import { DataTable } from "@/shared/ui/data-table";
import { Dialog } from "@/shared/ui/dialog";
import { Button, Card, CardHeader, Field, fieldClass, InfoRow, Note, PageHeader, Tag } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { pricingProfilesUseCases } from "../application/pricing-profiles.use-cases";
import { STRATEGY_LABELS, ZONE_TYPE_LABELS, type PricingZone, type ProfileDetail, type ProfileSummary, type ZoneDraft, type ZoneType } from "../domain/pricing-profile";

export function PricingProfilesView() {
  const profiles = useResource(() => pricingProfilesUseCases.profiles(), "profiles");
  const zones = useResource(() => pricingProfilesUseCases.zones(), "zones");
  const canWrite = useCanWrite("pricing-profiles");
  const { busy, run } = useAction();
  const [detail, setDetail] = useState<ProfileSummary | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <>
      <PageHeader title="Profils tarifaires et zones" />
      <Card className="overflow-hidden">
        <CardHeader title="Profils tarifaires" />
        <ResourceView state={profiles} onRetry={profiles.reload}>
          {(rows) => (
            <DataTable<ProfileSummary>
              rows={rows}
              rowKey={(p) => p.id}
              empty="Aucun profil."
              columns={[
                { key: "n", header: "Nom", render: (p) => <b>{p.name}</b> },
                { key: "s", header: "Service", render: (p) => `${p.service}${p.vehicleType ? ` · ${p.vehicleType}` : ""}` },
                { key: "st", header: "Stratégie", render: (p) => STRATEGY_LABELS[p.strategy] ?? p.strategy },
                { key: "v", header: "Version", align: "right", render: (p) => `v${p.version}` },
                { key: "u", header: "Modifié le", render: (p) => dayMonth(p.updatedAt) },
                {
                  key: "a",
                  header: "",
                  render: (p) => (
                    <span className="flex gap-1.5">
                      {p.active ? <Tag tone="ok">Actif</Tag> : null}
                      <Button size="sm" onClick={() => setDetail(p)}>
                        Détail
                      </Button>
                      <Button
                        size="sm"
                        disabled={!canWrite || busy}
                        onClick={async () => {
                          const r = await run(() => (p.active ? pricingProfilesUseCases.deactivate(p) : pricingProfilesUseCases.activate(p)), p.active ? "Profil désactivé." : "Profil activé : il sert désormais au calcul des prix.");
                          if (r !== undefined) profiles.reload();
                        }}
                      >
                        {p.active ? "Désactiver" : "Activer"}
                      </Button>
                      {!p.active ? (
                        <Button
                          size="sm"
                          tone="danger"
                          disabled={!canWrite || busy}
                          onClick={async () => {
                            const r = await run(() => pricingProfilesUseCases.removeProfile(p), "Profil supprimé.");
                            if (r !== undefined) profiles.reload();
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
        <Note className="m-4">Les composantes (prix au km, minute, attente, approche, assurance…) sont créées côté backend (POST /api/admin/pricing/profiles) : formulaire à venir. Activer un profil désactive le précédent du même service.</Note>
      </Card>
      <Card className="overflow-hidden">
        <CardHeader title="Zones de tarification">
          <Button size="sm" tone="primary" disabled={!canWrite} onClick={() => setCreating(true)}>
            Nouvelle zone
          </Button>
        </CardHeader>
        <ResourceView state={zones} onRetry={zones.reload}>
          {(rows) => (
            <DataTable<PricingZone>
              rows={rows}
              rowKey={(z) => z.id}
              empty="Aucune zone."
              columns={[
                { key: "c", header: "Code", render: (z) => <code className="text-xs">{z.code}</code> },
                { key: "n", header: "Nom", render: (z) => <b>{z.name}</b> },
                { key: "s", header: "Service", render: (z) => z.service },
                { key: "t", header: "Type", render: (z) => ZONE_TYPE_LABELS[z.type] ?? z.type },
                {
                  key: "a",
                  header: "",
                  render: (z) => (
                    <span className="flex gap-1.5">
                      {z.active ? null : <Tag tone="warn">Inactive</Tag>}
                      <Button
                        size="sm"
                        disabled={!canWrite || busy}
                        onClick={async () => {
                          const r = await run(() => pricingProfilesUseCases.setZoneActive(z, !z.active), z.active ? "Zone désactivée." : "Zone activée.");
                          if (r !== undefined) zones.reload();
                        }}
                      >
                        {z.active ? "Désactiver" : "Activer"}
                      </Button>
                      <Button
                        size="sm"
                        tone="danger"
                        disabled={!canWrite || busy}
                        onClick={async () => {
                          const r = await run(() => pricingProfilesUseCases.removeZone(z), "Zone supprimée.");
                          if (r !== undefined) zones.reload();
                        }}
                      >
                        Supprimer
                      </Button>
                    </span>
                  ),
                },
              ]}
            />
          )}
        </ResourceView>
      </Card>
      {detail ? <DetailDialog summary={detail} onClose={() => setDetail(null)} /> : null}
      {creating ? (
        <ZoneDialog
          existing={zones.data ?? []}
          onClose={() => setCreating(false)}
          onDone={() => {
            setCreating(false);
            zones.reload();
          }}
        />
      ) : null}
    </>
  );
}

function DetailDialog({ summary, onClose }: { summary: ProfileSummary; onClose: () => void }) {
  const detail = useResource(() => pricingProfilesUseCases.profile(summary.id), summary.id);
  return (
    <Dialog open title={summary.name} onClose={onClose} footer={<Button onClick={onClose}>Fermer</Button>}>
      <ResourceView state={detail} onRetry={detail.reload}>
        {(d: ProfileDetail) => (
          <>
            {d.description ? <p className="text-sm text-muted">{d.description}</p> : null}
            <InfoRow label="Commission WAMI">{percent(d.commissionRate, 1)}</InfoRow>
            <InfoRow label="Part du chauffeur">{percent(d.driverShareRate, 1)}</InfoRow>
            <DataTable
              rows={d.components}
              rowKey={(c) => `${c.type}-${c.label}`}
              empty="Aucune composante."
              columns={[
                { key: "t", header: "Composante", render: (c) => <span className="flex flex-col"><b>{c.label}</b><span className="text-xs text-muted">{c.type}</span></span> },
                { key: "s", header: "Valeur", render: (c) => c.summary },
              ]}
            />
          </>
        )}
      </ResourceView>
    </Dialog>
  );
}

function ZoneDialog({ existing, onClose, onDone }: { existing: PricingZone[]; onClose: () => void; onDone: () => void }) {
  const [d, setD] = useState<ZoneDraft>({ service: "RIDE", code: "", name: "", type: "CITY" });
  const { busy, run } = useAction();
  return (
    <Dialog
      open
      title="Nouvelle zone"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button
            tone="primary"
            busy={busy}
            onClick={async () => {
              const r = await run(() => pricingProfilesUseCases.createZone(d, existing), "Zone créée.");
              if (r !== undefined) onDone();
            }}
          >
            Créer
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Service">
          <input className={fieldClass} value={d.service} onChange={(e) => setD({ ...d, service: e.target.value.toUpperCase() })} />
        </Field>
        <Field label="Code" hint="Ex. COTONOU">
          <input className={fieldClass} value={d.code} onChange={(e) => setD({ ...d, code: e.target.value.toUpperCase() })} />
        </Field>
      </div>
      <Field label="Nom">
        <input className={fieldClass} value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} />
      </Field>
      <Field label="Type">
        <select className={fieldClass} value={d.type} onChange={(e) => setD({ ...d, type: e.target.value as ZoneType })}>
          {(Object.keys(ZONE_TYPE_LABELS) as ZoneType[]).map((t) => (
            <option key={t} value={t}>
              {ZONE_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </Field>
    </Dialog>
  );
}
