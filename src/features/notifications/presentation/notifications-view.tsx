"use client";

import { useState } from "react";
import { useAction } from "@/shared/hooks/use-action";
import { useResource } from "@/shared/hooks/use-resource";
import { dateTime } from "@/shared/lib/format";
import { useCanWrite } from "@/shared/ui/app-shell";
import { DataTable } from "@/shared/ui/data-table";
import { Button, Card, CardHeader, Field, fieldClass, Note, PageHeader, Segmented, Tag } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { notificationsUseCases } from "../application/notifications.use-cases";
import { AUDIENCE_LABELS, SMS_MAX, type Audience, type Campaign, type CampaignDraft } from "../domain/campaign";

const EMPTY: CampaignDraft = { title: "", body: "", audience: "clients", channel: "push", zone: "Cotonou", scheduledAt: null };

export function NotificationsView() {
  const list = useResource(() => notificationsUseCases.list(), "campaigns");
  const canWrite = useCanWrite("notifications");
  const { busy, run } = useAction();
  const [d, setD] = useState<CampaignDraft>(EMPTY);

  return (
    <>
      <PageHeader title="Notifications" />
      <div className="grid gap-3.5 xl:grid-cols-[380px_minmax(0,1fr)]">
        <Card className="flex flex-col gap-3 px-4 py-3.5">
          <b className="text-sm">Nouvelle campagne</b>
          <Segmented
            label="Canal"
            value={d.channel}
            onChange={(channel) => setD({ ...d, channel })}
            options={[
              ["push", "Notification push"],
              ["sms", "SMS"],
            ]}
          />
          <Field label="Audience">
            <select className={fieldClass} value={d.audience} onChange={(e) => setD({ ...d, audience: e.target.value as Audience })}>
              {(Object.keys(AUDIENCE_LABELS) as Audience[]).map((a) => (
                <option key={a} value={a}>
                  {AUDIENCE_LABELS[a]}
                </option>
              ))}
            </select>
          </Field>
          {d.channel === "push" ? (
            <Field label="Titre">
              <input className={fieldClass} value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} />
            </Field>
          ) : null}
          <Field label="Message" hint={d.channel === "sms" ? `${d.body.length} / ${SMS_MAX} caractères` : `${d.body.length} / 240 caractères`}>
            <textarea className={`${fieldClass} h-24 py-2`} value={d.body} onChange={(e) => setD({ ...d, body: e.target.value })} />
          </Field>
          <Field label="Envoi programmé (facultatif)">
            <input className={fieldClass} type="datetime-local" onChange={(e) => setD({ ...d, scheduledAt: e.target.value ? new Date(e.target.value).toISOString() : null })} />
          </Field>
          <Button
            tone="primary"
            busy={busy}
            disabled={!canWrite}
            onClick={async () => {
              const r = await run(() => notificationsUseCases.send(d), d.scheduledAt ? "Campagne programmée." : "Campagne envoyée.");
              if (r) {
                list.mutate((l) => [r, ...l]);
                setD(EMPTY);
              }
            }}
          >
            {d.scheduledAt ? "Programmer" : "Envoyer maintenant"}
          </Button>
          <Note>Fournisseur SMS (Infobip ?), coût par SMS et consentement des destinataires : à valider.</Note>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader title="Historique" />
          <ResourceView state={list} onRetry={list.reload}>
            {(rows) => (
              <DataTable<Campaign>
                rows={rows}
                rowKey={(c) => c.id}
                columns={[
                  { key: "title", header: "Campagne", render: (c) => <b>{c.title || c.body.slice(0, 40)}</b> },
                  { key: "aud", header: "Audience", render: (c) => AUDIENCE_LABELS[c.audience] },
                  { key: "chan", header: "Canal", render: (c) => (c.channel === "sms" ? "SMS" : "Push") },
                  { key: "rec", header: "Destinataires", align: "right", render: (c) => c.recipients.toLocaleString("fr-FR") },
                  { key: "when", header: "Quand", render: (c) => (c.scheduledAt ? dateTime(c.scheduledAt) : "—") },
                  { key: "status", header: "", render: (c) => <Tag tone={c.status === "sent" ? "ok" : c.status === "scheduled" ? "info" : "neutral"}>{c.status === "sent" ? "Envoyée" : c.status === "scheduled" ? "Programmée" : "Brouillon"}</Tag> },
                  { key: "by", header: "Par", render: (c) => c.createdBy },
                ]}
              />
            )}
          </ResourceView>
        </Card>
      </div>
    </>
  );
}
