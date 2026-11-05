"use client";

import { useState } from "react";
import { useAction } from "@/shared/hooks/use-action";
import { useResource } from "@/shared/hooks/use-resource";
import { useCanWrite } from "@/shared/ui/app-shell";
import { Button, Card, CardHeader, Field, fieldClass, Kpi, Note, PageHeader, Toggle } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { walletConfigUseCases } from "../application/wallet-config.use-cases";
import type { WalletConfig, WelcomeBonus } from "../domain/wallet-config";

const num = (v: string) => Number(v.replace(/\D/g, ""));
const pct = (r: number) => String(Math.round(r * 1000) / 10);

export function WalletConfigView() {
  const config = useResource(() => walletConfigUseCases.config(), "config");
  const bonus = useResource(() => walletConfigUseCases.welcomeBonus(), "bonus");
  return (
    <>
      <PageHeader title="Règles des portefeuilles" />
      <ResourceView state={config} onRetry={config.reload}>
        {(c) => <ConfigForm initial={c} />}
      </ResourceView>
      <ResourceView state={bonus} onRetry={bonus.reload}>
        {(b) => <BonusForm initial={b} />}
      </ResourceView>
      <Note>Frais, minimums de retrait et plafonds de dotation : valeurs proposées, à valider. Elles s’appliquent immédiatement à toute la plateforme.</Note>
    </>
  );
}

function ConfigForm({ initial }: { initial: WalletConfig }) {
  const [c, setC] = useState(initial);
  const canWrite = useCanWrite("wallet-config");
  const { busy, run } = useAction();
  const set = <K extends keyof WalletConfig>(k: K, v: WalletConfig[K]) => setC({ ...c, [k]: v });
  const field = (k: keyof WalletConfig, label: string, hint?: string) => (
    <Field label={label} hint={hint}>
      <input className={fieldClass} inputMode="numeric" disabled={!canWrite} value={c[k] as number} onChange={(e) => set(k, num(e.target.value) as never)} />
    </Field>
  );
  const rate = (k: "consolidationFeeRate" | "p2pTransferFeeRate", label: string) => (
    <Field label={label}>
      <input className={fieldClass} inputMode="decimal" disabled={!canWrite} defaultValue={pct(c[k])} onChange={(e) => set(k, Number(e.target.value.replace(",", ".")) / 100)} />
    </Field>
  );
  return (
    <Card className="flex flex-col gap-3 px-4 py-3.5">
      <CardHeader title="Transferts, retraits et dotations" />
      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Toggle checked={c.consolidationEnabled} label="Consolidation des soldes" disabled={!canWrite} onChange={(v) => set("consolidationEnabled", v)} />
          {rate("consolidationFeeRate", "Frais de consolidation (%)")}
          {field("consolidationMinAmount", "Montant minimum de consolidation (F)")}
        </div>
        <div className="flex flex-col gap-2">
          <Toggle checked={c.p2pTransferEnabled} label="Transferts entre utilisateurs" disabled={!canWrite} onChange={(v) => set("p2pTransferEnabled", v)} />
          {rate("p2pTransferFeeRate", "Frais de transfert (%)")}
          {field("p2pMinimumAmount", "Montant minimum de transfert (F)")}
        </div>
        {field("withdrawalMinMobileMoney", "Retrait minimum, Mobile Money (F)")}
        {field("withdrawalMinBankTransfer", "Retrait minimum, virement (F)")}
        {field("grantMaxPerBeneficiary", "Dotation : plafond par bénéficiaire (F)")}
        {field("grantMaxTotal", "Dotation : plafond total (F)")}
        {field("grantMaxBeneficiaries", "Dotation : nombre maximal de bénéficiaires")}
      </div>
      <Button
        tone="primary"
        className="self-start"
        disabled={!canWrite}
        busy={busy}
        onClick={async () => {
          await run(() => walletConfigUseCases.saveConfig(c), "Règles enregistrées.");
        }}
      >
        Enregistrer
      </Button>
    </Card>
  );
}

function BonusForm({ initial }: { initial: WelcomeBonus }) {
  const [b, setB] = useState(initial);
  const canWrite = useCanWrite("wallet-config");
  const { busy, run } = useAction();
  return (
    <Card className="flex flex-col gap-3 px-4 py-3.5">
      <CardHeader title="Bonus de bienvenue des chauffeurs" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Kpi label="Places consommées" value={`${b.consumed} / ${b.maxDrivers}`} />
        <Kpi label="Places restantes" value={String(b.remaining)} />
      </div>
      <Toggle checked={b.active} label="Bonus actif" disabled={!canWrite} onChange={(v) => setB({ ...b, active: v })} />
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Montant du bonus (F)">
          <input className={fieldClass} inputMode="numeric" disabled={!canWrite} value={b.amount} onChange={(e) => setB({ ...b, amount: num(e.target.value) })} />
        </Field>
        <Field label="Nombre de chauffeurs éligibles">
          <input className={fieldClass} inputMode="numeric" disabled={!canWrite} value={b.maxDrivers} onChange={(e) => setB({ ...b, maxDrivers: num(e.target.value) })} />
        </Field>
      </div>
      <Button
        tone="primary"
        className="self-start"
        disabled={!canWrite}
        busy={busy}
        onClick={async () => {
          await run(() => walletConfigUseCases.saveWelcomeBonus(b), "Bonus de bienvenue enregistré.");
        }}
      >
        Enregistrer
      </Button>
    </Card>
  );
}
