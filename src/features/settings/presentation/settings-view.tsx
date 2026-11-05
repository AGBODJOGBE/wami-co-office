"use client";

import { useState } from "react";
import { useAction } from "@/shared/hooks/use-action";
import { useResource } from "@/shared/hooks/use-resource";
import { useCanWrite } from "@/shared/ui/app-shell";
import { Button, Card, Field, fieldClass, Note, PageHeader } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { settingsUseCases } from "../application/settings.use-cases";
import { WEEKDAYS, type PlatformSettings } from "../domain/settings";

export function SettingsView() {
  const settings = useResource(() => settingsUseCases.get(), "settings");
  return (
    <>
      <PageHeader title="Paramètres de la plateforme" />
      <ResourceView state={settings} onRetry={settings.reload}>
        {(s) => <SettingsForm initial={s} onSaved={(ns) => settings.mutate(() => ns)} />}
      </ResourceView>
    </>
  );
}

function SettingsForm({ initial, onSaved }: { initial: PlatformSettings; onSaved: (s: PlatformSettings) => void }) {
  const [s, setS] = useState(initial);
  const canWrite = useCanWrite("settings");
  const { busy, run } = useAction();
  const num = (k: keyof PlatformSettings) => (
    <input className={fieldClass} inputMode="numeric" disabled={!canWrite} value={String(s[k])} onChange={(e) => setS({ ...s, [k]: Number(e.target.value.replace(/\D/g, "")) })} />
  );

  return (
    <Card className="flex max-w-3xl flex-col gap-4 px-5 py-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Acceptation d’une offre (secondes)" hint="Chauffeurs et livreurs, WAMI Pro">
          {num("offerAcceptSeconds")}
        </Field>
        <Field label="Acceptation d’une commande (minutes)" hint="Restaurants, WAMI Business">
          {num("orderAcceptMinutes")}
        </Field>
        <Field label="Jour des versements">
          <select className={fieldClass} disabled={!canWrite} value={s.payoutWeekday} onChange={(e) => setS({ ...s, payoutWeekday: Number(e.target.value) })}>
            {WEEKDAYS.map((d, i) => (
              <option key={d} value={i + 1}>
                {d}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Versement minimum (F)">{num("payoutMinimum")}</Field>
        <Field label="Délai de réponse support (minutes)">{num("supportSlaMinutes")}</Field>
        <Field label="Numéro SOS affiché dans les apps">
          <input className={fieldClass} disabled={!canWrite} value={s.sosPhone} onChange={(e) => setS({ ...s, sosPhone: e.target.value })} />
        </Field>
      </div>
      <Field label="Message de maintenance (vide = aucun)" hint="Affiché en bandeau dans toutes les apps.">
        <input className={fieldClass} disabled={!canWrite} value={s.maintenanceMessage} onChange={(e) => setS({ ...s, maintenanceMessage: e.target.value })} />
      </Field>
      <div className="flex justify-end">
        <Button
          tone="primary"
          busy={busy}
          disabled={!canWrite}
          onClick={async () => {
            const r = await run(() => settingsUseCases.save(s), "Paramètres enregistrés.");
            if (r) onSaved(r);
          }}
        >
          Enregistrer
        </Button>
      </div>
      <Note>Toutes ces valeurs sont des propositions à valider. Les tarifs et commissions se règlent dans « Tarifs et zones ».</Note>
    </Card>
  );
}
