"use client";

import { useAction } from "@/shared/hooks/use-action";
import { useResource } from "@/shared/hooks/use-resource";
import { useCanWrite } from "@/shared/ui/app-shell";
import { Card, Note, PageHeader, Tag, Toggle } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { vtcUseCases } from "../application/vtc.use-cases";

export function VtcView() {
  const cats = useResource(() => vtcUseCases.categories(), "vtc");
  const { busy, run } = useAction();
  const canWrite = useCanWrite("vtc");

  return (
    <>
      <PageHeader title="Offres VTC" />
      <ResourceView state={cats} onRetry={cats.reload}>
        {(list) => (
          <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-4">
            {list.map((c) => (
              <Card key={c.key} className="flex flex-col gap-2 px-4 py-3.5">
                <div className="flex items-center justify-between">
                  <b className="text-sm">{c.label}</b>
                  <Toggle
                    checked={c.active}
                    label={`Proposer ${c.label}`}
                    disabled={!canWrite || busy}
                    onChange={async () => {
                      const r = await run(() => vtcUseCases.toggle(c, list), c.active ? `${c.label} masqué aux clients.` : `${c.label} proposé aux clients.`);
                      if (r) cats.mutate((l) => l.map((x) => (x.key === r.key ? r : x)));
                    }}
                  />
                </div>
                <span className="text-xs text-muted">{c.description}</span>
                <span className="text-xs">
                  {c.seats} place{c.seats > 1 ? "s" : ""} · {c.onlinePartners} partenaires en ligne
                </span>
                <Tag tone={c.active ? "ok" : "neutral"}>{c.active ? "Proposé" : "Masqué"}</Tag>
              </Card>
            ))}
          </div>
        )}
      </ResourceView>
      <Note>Les prix de chaque offre se règlent dans « Tarifs et zones ». Offre « Confort » et tricycle passagers : à valider.</Note>
    </>
  );
}
