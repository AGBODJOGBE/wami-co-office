"use client";

import { useState } from "react";
import { useAction } from "@/shared/hooks/use-action";
import { useResource } from "@/shared/hooks/use-resource";
import { dayMonth } from "@/shared/lib/format";
import { useCanWrite } from "@/shared/ui/app-shell";
import { DataTable } from "@/shared/ui/data-table";
import { Button, Card, Note, PageHeader, Tag } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { partnersUseCases } from "../application/partners.use-cases";
import { missingChecks, type PendingPartner } from "../domain/partner";

export function PartnersView() {
  const partners = useResource(() => partnersUseCases.pending(), "partners");
  const canWrite = useCanWrite("partners");
  const { busy, run } = useAction();
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());

  return (
    <>
      <PageHeader title="Partenaires à valider" />
      <Card className="overflow-hidden">
        <ResourceView state={partners} onRetry={partners.reload}>
          {(rows) => (
            <DataTable<PendingPartner>
              rows={rows}
              rowKey={(p) => p.id}
              empty="Aucun partenaire en attente."
              columns={[
                { key: "c", header: "Entreprise", render: (p) => <span className="flex flex-col"><b>{p.company}</b><span className="text-xs text-muted">{p.type}</span></span> },
                { key: "ph", header: "Contact", render: (p) => <span className="flex flex-col">{p.phone}<span className="text-xs text-muted">{p.email ?? "pas d’e-mail"}</span></span> },
                { key: "r", header: "Immatriculation", render: (p) => p.registrationNumber ?? <Tag tone="warn">Manquante</Tag> },
                { key: "d", header: "Inscrit le", render: (p) => dayMonth(p.createdAt) },
                {
                  key: "a",
                  header: "",
                  render: (p) => (
                    <span className="flex items-center gap-2">
                      {missingChecks(p).length > 0 ? (
                        <label className="flex items-center gap-1 text-xs">
                          <input
                            type="checkbox"
                            checked={confirmed.has(p.id)}
                            onChange={(e) => setConfirmed((s) => { const n = new Set(s); if (e.target.checked) n.add(p.id); else n.delete(p.id); return n; })}
                          />
                          Valider malgré tout
                        </label>
                      ) : null}
                      <Button
                        size="sm"
                        tone="primary"
                        disabled={!canWrite || busy}
                        onClick={async () => {
                          const r = await run(() => partnersUseCases.validate(p, confirmed.has(p.id)), `${p.company} est validé.`);
                          if (r !== undefined) partners.reload();
                        }}
                      >
                        Valider
                      </Button>
                    </span>
                  ),
                },
              ]}
            />
          )}
        </ResourceView>
      </Card>
      <Note>Le refus d’un partenaire n’existe pas encore côté backend : seules la liste et la validation sont disponibles.</Note>
    </>
  );
}
