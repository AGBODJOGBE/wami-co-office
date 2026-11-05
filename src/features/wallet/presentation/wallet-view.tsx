"use client";

import { useState } from "react";
import { useSession } from "@/shared/auth/session.store";
import { useAction } from "@/shared/hooks/use-action";
import { useResource } from "@/shared/hooks/use-resource";
import { dateTime, fcfa } from "@/shared/lib/format";
import { useCanWrite } from "@/shared/ui/app-shell";
import { DataTable } from "@/shared/ui/data-table";
import { Button, Card, CardHeader, Field, fieldClass, PageHeader, Tag } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { walletUseCases } from "../application/wallet.use-cases";
import type { Wallet, WalletMovement } from "../domain/wallet";

const OWNER: Record<Wallet["ownerType"], string> = { client: "Client", partner: "Partenaire", establishment: "Établissement" };

export function WalletView() {
  const [q, setQ] = useState("");
  const wallets = useResource(() => walletUseCases.list(q), q);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <>
      <PageHeader title="Portefeuilles">
        <label className="ml-auto w-72">
          <span className="sr-only">Rechercher un portefeuille</span>
          <input className={fieldClass} placeholder="Nom ou téléphone…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </PageHeader>
      <ResourceView state={wallets} onRetry={wallets.reload}>
        {(list) => {
          const selected = list.find((w) => w.id === selectedId) ?? null;
          return (
            <div className="grid gap-3.5 xl:grid-cols-[minmax(0,1fr)_380px]">
              <Card className="overflow-hidden">
                <DataTable<Wallet>
                  rows={list}
                  rowKey={(w) => w.id}
                  selectedKey={selectedId}
                  onSelect={(w) => setSelectedId(w.id)}
                  columns={[
                    { key: "name", header: "Titulaire", render: (w) => w.ownerName },
                    { key: "type", header: "Type", render: (w) => OWNER[w.ownerType] },
                    { key: "phone", header: "Téléphone", render: (w) => w.phone },
                    { key: "balance", header: "Solde", align: "right", render: (w) => <span className={w.balance < 0 ? "font-bold text-bad" : undefined}>{fcfa(w.balance)}</span> },
                    { key: "status", header: "", render: (w) => (w.status === "frozen" ? <Tag tone="bad">Gelé</Tag> : null) },
                  ]}
                />
              </Card>
              {selected ? (
                <WalletPanel key={selected.id} wallet={selected} onChange={(w) => wallets.mutate((l) => l.map((x) => (x.id === w.id ? w : x)))} />
              ) : (
                <Card className="flex items-center justify-center p-6 text-sm text-muted">Sélectionnez un portefeuille.</Card>
              )}
            </div>
          );
        }}
      </ResourceView>
    </>
  );
}

function WalletPanel({ wallet, onChange }: { wallet: Wallet; onChange: (w: Wallet) => void }) {
  const isSuperAdmin = useSession((s) => s.user?.role === "superAdmin");
  const canWrite = useCanWrite("wallet");
  const { busy, run } = useAction();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  return (
    <Card className="flex flex-col gap-2 px-4 py-3.5">
      <div className="flex items-center justify-between">
        <b className="text-[15px]">{wallet.ownerName}</b>
        <span className="tabular font-display text-lg font-bold">{fcfa(wallet.balance)}</span>
      </div>
      <CardHeader title="Derniers mouvements" />
      <DataTable<WalletMovement>
        rows={wallet.movements}
        rowKey={(m) => m.id}
        columns={[
          { key: "at", header: "Date", render: (m) => dateTime(m.at) },
          { key: "label", header: "Libellé", render: (m) => m.label },
          { key: "amount", header: "Montant", align: "right", render: (m) => <span className={m.amount < 0 ? "text-bad" : "text-ok"}>{fcfa(m.amount, { signed: true })}</span> },
        ]}
      />
      <b className="mt-2 text-sm">Ajustement manuel</b>
      <Field label="Montant (F)" hint="Positif pour créditer, négatif pour débiter.">
        <input className={fieldClass} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d-]/g, ""))} />
      </Field>
      <Field label="Motif">
        <input className={fieldClass} value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
      <Button
        tone="primary"
        disabled={!canWrite}
        busy={busy}
        onClick={async () => {
          const r = await run(() => walletUseCases.adjust(wallet, Number(amount), reason, isSuperAdmin), "Ajustement enregistré et tracé dans le journal.");
          if (r) {
            onChange(r);
            setAmount("");
            setReason("");
          }
        }}
      >
        Enregistrer l’ajustement
      </Button>
    </Card>
  );
}
