"use client";

import { useState } from "react";
import { useAction } from "@/shared/hooks/use-action";
import { useResource } from "@/shared/hooks/use-resource";
import { dateTime, fcfa, hhmm } from "@/shared/lib/format";
import { useCanWrite } from "@/shared/ui/app-shell";
import { DataTable } from "@/shared/ui/data-table";
import { Button, Card, Chip, PageHeader, Segmented, Tag } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { deliveryUseCases } from "../application/delivery.use-cases";
import { DELIVERY_STATUS_LABELS, lateMinutes, type Delivery, type DeliveryType } from "../domain/delivery";

export function DeliveryView() {
  const [type, setType] = useState<DeliveryType | "all">("all");
  const [onlyLate, setOnlyLate] = useState(false);
  const list = useResource(() => deliveryUseCases.list({ type, onlyLate }), `${type}|${onlyLate}`);
  const { busy, run } = useAction();
  const canWrite = useCanWrite("delivery");
  const now = new Date();

  return (
    <>
      <PageHeader title="Livraisons">
        <Segmented
          label="Type"
          value={type}
          onChange={setType}
          options={[
            ["all", "Toutes"],
            ["parcel", "Colis"],
            ["meal", "Repas"],
          ]}
        />
        <Chip on={onlyLate} onClick={() => setOnlyLate(!onlyLate)}>
          En retard seulement
        </Chip>
      </PageHeader>
      <Card className="overflow-hidden">
        <ResourceView state={list} onRetry={list.reload}>
          {(rows) => (
            <DataTable<Delivery>
              rows={rows}
              rowKey={(d) => d.id}
              empty="Aucune livraison."
              columns={[
                { key: "id", header: "Livraison", render: (d) => <b>{d.id}</b> },
                { key: "type", header: "Type", render: (d) => (d.type === "meal" ? `Repas · ${d.detail}` : `Colis ${d.detail}`) },
                {
                  key: "status",
                  header: "Statut",
                  render: (d) => {
                    const late = lateMinutes(d, now);
                    return late > 0 ? <Tag tone="warn">En retard {late} min</Tag> : <Tag tone={d.status === "delivered" ? "ok" : d.status === "failed" ? "bad" : "info"}>{DELIVERY_STATUS_LABELS[d.status]}</Tag>;
                  },
                },
                { key: "route", header: "Trajet", render: (d) => `${d.from} → ${d.to}` },
                { key: "courier", header: "Livreur", render: (d) => d.courierName ?? "—" },
                { key: "cash", header: "À encaisser", align: "right", render: (d) => (d.cashToCollect ? fcfa(d.cashToCollect) : "—") },
                { key: "price", header: "Prix", align: "right", render: (d) => fcfa(d.price) },
                { key: "promised", header: "Promise à", render: (d) => hhmm(d.promisedAt) },
                { key: "created", header: "Créée", render: (d) => dateTime(d.createdAt) },
                {
                  key: "act",
                  header: "",
                  render: (d) =>
                    d.status === "searching" || d.status === "pickup" ? (
                      <Button
                        size="sm"
                        tone="danger"
                        disabled={!canWrite || busy}
                        onClick={async () => {
                          const r = await run(() => deliveryUseCases.cancel(d, "Annulée par le back-office (aucun livreur)"), "Livraison annulée.");
                          if (r) list.mutate((l) => l.map((x) => (x.id === r.id ? r : x)));
                        }}
                      >
                        Annuler
                      </Button>
                    ) : null,
                },
              ]}
            />
          )}
        </ResourceView>
      </Card>
    </>
  );
}
