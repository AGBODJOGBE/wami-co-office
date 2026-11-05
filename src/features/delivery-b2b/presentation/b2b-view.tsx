"use client";

import { useState } from "react";
import { useAction } from "@/shared/hooks/use-action";
import { useResource } from "@/shared/hooks/use-resource";
import { dayMonth, fcfa, percent } from "@/shared/lib/format";
import { useCanWrite } from "@/shared/ui/app-shell";
import { DataTable } from "@/shared/ui/data-table";
import { Button, Card, CardHeader, Field, fieldClass, InfoRow, Note, PageHeader, Tag } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { b2bUseCases } from "../application/b2b.use-cases";
import { availableCredit, creditUsage, type B2bAccount, type Invoice } from "../domain/b2b";

export function B2bView() {
  const accounts = useResource(() => b2bUseCases.accounts(), "b2b");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <>
      <PageHeader title="Comptes entreprises (livraison B2B)" />
      <ResourceView state={accounts} onRetry={accounts.reload}>
        {(list) => {
          const selected = list.find((a) => a.id === selectedId) ?? null;
          return (
            <div className="grid gap-3.5 xl:grid-cols-[minmax(0,1fr)_360px]">
              <Card className="overflow-hidden">
                <DataTable<B2bAccount>
                  rows={list}
                  rowKey={(a) => a.id}
                  selectedKey={selectedId}
                  onSelect={(a) => setSelectedId(a.id)}
                  columns={[
                    { key: "company", header: "Entreprise", render: (a) => a.company },
                    { key: "sector", header: "Secteur", render: (a) => a.sector },
                    { key: "status", header: "Statut", render: (a) => <Tag tone={a.status === "active" ? "ok" : "bad"}>{a.status === "active" ? "Actif" : "Suspendu"}</Tag> },
                    { key: "month", header: "Livraisons du mois", align: "right", render: (a) => String(a.monthDeliveries) },
                    { key: "amount", header: "Montant du mois", align: "right", render: (a) => fcfa(a.monthAmount) },
                    {
                      key: "credit",
                      header: "Encours / plafond",
                      align: "right",
                      render: (a) => (
                        <span className={creditUsage(a) >= 0.9 ? "font-bold text-bad" : undefined}>
                          {fcfa(a.outstanding)} / {fcfa(a.creditLimit)}
                        </span>
                      ),
                    },
                  ]}
                />
              </Card>
              {selected ? (
                <AccountPanel key={selected.id} account={selected} onChange={(a) => accounts.mutate((l) => l.map((x) => (x.id === a.id ? a : x)))} />
              ) : (
                <Card className="flex items-center justify-center p-6 text-sm text-muted">Sélectionnez une entreprise.</Card>
              )}
            </div>
          );
        }}
      </ResourceView>
    </>
  );
}

function AccountPanel({ account, onChange }: { account: B2bAccount; onChange: (a: B2bAccount) => void }) {
  const invoices = useResource(() => b2bUseCases.invoices(account.id), account.id);
  const { busy, run } = useAction();
  const canWrite = useCanWrite("delivery-b2b");
  const [limit, setLimit] = useState(String(account.creditLimit));

  return (
    <Card className="flex flex-col gap-1 px-4 py-3.5">
      <b className="text-[15px]">{account.company}</b>
      <InfoRow label="Contact">
        {account.contactName} · {account.contactPhone}
      </InfoRow>
      <InfoRow label="Délai de paiement">{account.paymentTermDays} jours</InfoRow>
      <InfoRow label="Crédit disponible">{fcfa(availableCredit(account))}</InfoRow>
      <InfoRow label="Utilisation du plafond">{percent(creditUsage(account))}</InfoRow>
      <div className="mt-2 flex items-end gap-2">
        <Field label="Plafond de crédit (F)">
          <input className={fieldClass} inputMode="numeric" value={limit} onChange={(e) => setLimit(e.target.value.replace(/\D/g, ""))} />
        </Field>
        <Button
          disabled={!canWrite}
          busy={busy}
          onClick={async () => {
            const r = await run(() => b2bUseCases.setCreditLimit(account, Number(limit)), "Plafond mis à jour.");
            if (r) onChange(r);
          }}
        >
          Enregistrer
        </Button>
      </div>
      <Button
        className="mt-2"
        tone={account.status === "active" ? "danger" : "primary"}
        disabled={!canWrite || busy}
        onClick={async () => {
          const r = await run(() => b2bUseCases.toggleSuspended(account), account.status === "active" ? "Compte suspendu." : "Compte réactivé.");
          if (r) onChange(r);
        }}
      >
        {account.status === "active" ? "Suspendre les commandes" : "Réactiver"}
      </Button>
      <CardHeader title="Factures" />
      <ResourceView state={invoices} onRetry={invoices.reload}>
        {(rows) => (
          <DataTable<Invoice>
            rows={rows}
            rowKey={(i) => i.id}
            columns={[
              { key: "period", header: "Période", render: (i) => i.period },
              { key: "amount", header: "Montant", align: "right", render: (i) => fcfa(i.amount) },
              { key: "due", header: "Échéance", render: (i) => dayMonth(i.dueAt) },
              { key: "status", header: "", render: (i) => <Tag tone={i.status === "paid" ? "ok" : i.status === "overdue" ? "bad" : "warn"}>{i.status === "paid" ? "Payée" : i.status === "overdue" ? "En retard" : "À payer"}</Tag> },
            ]}
          />
        )}
      </ResourceView>
      <Note>Contrat B2B, tarifs négociés et relances automatiques : à valider.</Note>
    </Card>
  );
}
