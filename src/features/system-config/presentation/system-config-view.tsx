"use client";

import { useState } from "react";
import { useSession } from "@/shared/auth/session.store";
import { useAction } from "@/shared/hooks/use-action";
import { useResource } from "@/shared/hooks/use-resource";
import { dateTime, dayMonth } from "@/shared/lib/format";
import { useCanWrite } from "@/shared/ui/app-shell";
import { DataTable } from "@/shared/ui/data-table";
import { Dialog } from "@/shared/ui/dialog";
import { Button, Card, Field, fieldClass, Note, PageHeader, Segmented, Tag } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { systemConfigUseCases } from "../application/system-config.use-cases";
import { boundsViolation, raisesMinimum, type AppVersion, type AppVersionDraft, type SystemParam } from "../domain/system-config";

const TABS = [["params", "Paramètres système"], ["versions", "Versions des applications"]] as const;

export function SystemConfigView() {
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("params");
  return (
    <>
      <PageHeader title="Configuration système">
        <div className="ml-auto">
          <Segmented label="Section" options={TABS} value={tab} onChange={setTab} />
        </div>
      </PageHeader>
      {tab === "params" ? <Params /> : <Versions />}
    </>
  );
}

function Params() {
  const params = useResource(() => systemConfigUseCases.params(), "params");
  const [editing, setEditing] = useState<SystemParam | null>(null);
  const isSuperAdmin = useSession((s) => s.user?.role === "superAdmin");
  return (
    <>
      <ResourceView state={params} onRetry={params.reload}>
        {(rows) => {
          const byModule = new Map<string, SystemParam[]>();
          for (const p of rows) byModule.set(p.module, [...(byModule.get(p.module) ?? []), p]);
          return [...byModule.entries()].map(([module, list]) => (
            <Card key={module} className="overflow-hidden">
              <div className="border-b border-field px-4 py-2 text-xs font-bold uppercase tracking-wide text-muted">{module}</div>
              <DataTable<SystemParam>
                rows={list}
                rowKey={(p) => p.key}
                columns={[
                  { key: "l", header: "Paramètre", render: (p) => <span className="flex flex-col"><b>{p.label}</b><span className="whitespace-normal text-xs text-muted">{p.description}</span></span> },
                  { key: "v", header: "Valeur", align: "right", render: (p) => <span className="flex items-center justify-end gap-1.5">{p.outOfBounds ? <Tag tone="warn">Hors bornes</Tag> : null}<b>{p.display}</b></span> },
                  { key: "b", header: "Bornes", render: (p) => bounds(p) },
                  { key: "u", header: "Modifié", render: (p) => `v${p.version} · ${dayMonth(p.updatedAt)}` },
                  { key: "a", header: "", render: (p) => <Button size="sm" disabled={!isSuperAdmin} onClick={() => setEditing(p)}>Modifier</Button> },
                ]}
              />
            </Card>
          ));
        }}
      </ResourceView>
      <Note>Seul un super admin modifie ces paramètres, qui s’appliquent immédiatement à toute la plateforme. Une valeur hors bornes exige une justification, conservée avec la version.</Note>
      {editing ? (
        <ParamDialog
          param={editing}
          isSuperAdmin={isSuperAdmin}
          onClose={() => setEditing(null)}
          onDone={() => {
            setEditing(null);
            params.reload();
          }}
        />
      ) : null}
    </>
  );
}

function bounds(p: SystemParam): string {
  if (p.allowed && p.allowed.length > 0) return p.allowed.join(" · ");
  const parts: string[] = [];
  if (p.min !== null) parts.push(`min ${p.min}`);
  if (p.max !== null) parts.push(`max ${p.max}`);
  if (p.mustDivide !== null) parts.push(`multiple de ${p.mustDivide}`);
  return parts.join(" · ") || "—";
}

function ParamDialog({ param, isSuperAdmin, onClose, onDone }: { param: SystemParam; isSuperAdmin: boolean; onClose: () => void; onDone: () => void }) {
  const [value, setValue] = useState(param.value);
  const [force, setForce] = useState(false);
  const [justification, setJustification] = useState("");
  const { busy, run } = useAction();
  const violation = value === param.value ? null : boundsViolation(param, value);
  return (
    <Dialog
      open
      title={param.label}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button
            tone="primary"
            busy={busy}
            onClick={async () => {
              const r = await run(() => systemConfigUseCases.saveParam(param, { value, force, justification }, isSuperAdmin), "Paramètre modifié.");
              if (r !== undefined) onDone();
            }}
          >
            Enregistrer
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted">{param.description}</p>
      <Field label={`Valeur${param.unit ? ` (${param.unit})` : ""}`} hint={`Bornes : ${bounds(param)}`}>
        {param.allowed && param.allowed.length > 0 ? (
          <select className={fieldClass} value={value} onChange={(e) => setValue(e.target.value)}>
            {param.allowed.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        ) : (
          <input className={fieldClass} value={value} onChange={(e) => setValue(e.target.value)} />
        )}
      </Field>
      {violation ? (
        <div className="flex flex-col gap-2 rounded-[10px] border border-warn p-3">
          <p className="text-sm text-warn">{violation}</p>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} />
            Forcer cette valeur hors bornes
          </label>
          {force ? (
            <Field label="Justification (conservée)">
              <input className={fieldClass} value={justification} onChange={(e) => setJustification(e.target.value)} />
            </Field>
          ) : null}
        </div>
      ) : null}
    </Dialog>
  );
}

function Versions() {
  const versions = useResource(() => systemConfigUseCases.versions(), "versions");
  const canWrite = useCanWrite("system-config");
  const [editing, setEditing] = useState<AppVersion | null>(null);
  return (
    <>
      <Card className="overflow-hidden">
        <ResourceView state={versions} onRetry={versions.reload}>
          {(rows) => (
            <DataTable<AppVersion>
              rows={rows}
              rowKey={(v) => v.id}
              empty="Aucune application configurée."
              columns={[
                { key: "a", header: "Application", render: (v) => <b>{v.appType} · {v.platform}</b> },
                { key: "l", header: "Dernière version", render: (v) => `${v.latestVersion} (${v.latestBuild})` },
                { key: "m", header: "Minimum accepté", render: (v) => `${v.minVersion} (${v.minBuild})` },
                { key: "f", header: "Mise à jour forcée dès", render: (v) => (v.forceUpdateAfter ? dateTime(v.forceUpdateAfter) : "—") },
                { key: "u", header: "Modifié", render: (v) => dayMonth(v.updatedAt) },
                { key: "e", header: "", render: (v) => <Button size="sm" disabled={!canWrite} onClick={() => setEditing(v)}>Modifier</Button> },
              ]}
            />
          )}
        </ResourceView>
      </Card>
      <Note>Relever la version minimale oblige les utilisateurs en retard à mettre à jour l’application avant de continuer.</Note>
      {editing ? (
        <VersionDialog
          version={editing}
          onClose={() => setEditing(null)}
          onDone={() => {
            setEditing(null);
            versions.reload();
          }}
        />
      ) : null}
    </>
  );
}

function VersionDialog({ version, onClose, onDone }: { version: AppVersion; onClose: () => void; onDone: () => void }) {
  const [d, setD] = useState<AppVersionDraft>({ appType: version.appType, platform: version.platform, packageId: version.packageId, latestVersion: version.latestVersion, latestBuild: version.latestBuild, minVersion: version.minVersion, minBuild: version.minBuild, forceUpdateAfter: version.forceUpdateAfter, downloadUrl: version.downloadUrl, releaseNotes: version.releaseNotes });
  const { busy, run } = useAction();
  const forces = raisesMinimum(version, d);
  return (
    <Dialog
      open
      title={`${version.appType} · ${version.platform}`}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button
            tone={forces ? "danger" : "primary"}
            busy={busy}
            onClick={async () => {
              const r = await run(() => systemConfigUseCases.saveVersion(d), forces ? "Version minimale relevée : les anciennes versions devront se mettre à jour." : "Versions enregistrées.");
              if (r !== undefined) onDone();
            }}
          >
            {forces ? "Enregistrer et forcer la mise à jour" : "Enregistrer"}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Dernière version">
          <input className={fieldClass} value={d.latestVersion} onChange={(e) => setD({ ...d, latestVersion: e.target.value })} />
        </Field>
        <Field label="Dernier build">
          <input className={fieldClass} inputMode="numeric" value={d.latestBuild} onChange={(e) => setD({ ...d, latestBuild: Number(e.target.value.replace(/\D/g, "")) })} />
        </Field>
        <Field label="Version minimale">
          <input className={fieldClass} value={d.minVersion} onChange={(e) => setD({ ...d, minVersion: e.target.value })} />
        </Field>
        <Field label="Build minimal">
          <input className={fieldClass} inputMode="numeric" value={d.minBuild} onChange={(e) => setD({ ...d, minBuild: Number(e.target.value.replace(/\D/g, "")) })} />
        </Field>
      </div>
      <Field label="Identifiant de l’application">
        <input className={fieldClass} value={d.packageId} onChange={(e) => setD({ ...d, packageId: e.target.value })} />
      </Field>
      <Field label="Lien de téléchargement">
        <input className={fieldClass} value={d.downloadUrl} onChange={(e) => setD({ ...d, downloadUrl: e.target.value })} />
      </Field>
      <Field label="Mise à jour forcée à partir du" hint="Vide = pas de date.">
        <input className={fieldClass} type="date" value={d.forceUpdateAfter?.slice(0, 10) ?? ""} onChange={(e) => setD({ ...d, forceUpdateAfter: e.target.value ? new Date(`${e.target.value}T00:00:00Z`).toISOString() : null })} />
      </Field>
      <Field label="Notes de version">
        <textarea className={`${fieldClass} h-20 py-2`} value={d.releaseNotes} onChange={(e) => setD({ ...d, releaseNotes: e.target.value })} />
      </Field>
    </Dialog>
  );
}
