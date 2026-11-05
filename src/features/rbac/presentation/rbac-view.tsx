"use client";

import { useState } from "react";
import { useSession } from "@/shared/auth/session.store";
import { useAction } from "@/shared/hooks/use-action";
import { useResource } from "@/shared/hooks/use-resource";
import { dateTime } from "@/shared/lib/format";
import { useCanWrite } from "@/shared/ui/app-shell";
import { DataTable } from "@/shared/ui/data-table";
import { Dialog } from "@/shared/ui/dialog";
import { MissingRoutes } from "@/shared/ui/missing-routes";
import { Button, Card, CardHeader, Chip, Field, fieldClass, Note, PageHeader, Tag, type Tone } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { rbacUseCases } from "../application/rbac.use-cases";
import { ADMIN_STATUS_LABELS, groupByModule, type AdminStatus, type AuditEntry, type Member, type NewMember, type RoleInfo } from "../domain/rbac";

const STATUS_TONE: Record<AdminStatus, Tone> = { active: "ok", suspended: "warn", deactivated: "bad" };
const CATEGORIES: Array<AuditEntry["category"] | "all"> = ["all", "Argent", "Comptes", "Réglages", "Opérations"];

export function RbacView() {
  const members = useResource(() => rbacUseCases.members(), "members");
  const roles = useResource(() => rbacUseCases.roles(), "roles");
  const [category, setCategory] = useState<AuditEntry["category"] | "all">("all");
  const audit = useResource(() => rbacUseCases.audit(category), category);
  const actingId = useSession((s) => s.user?.id ?? "");
  const canWrite = useCanWrite("rbac");
  const { busy, run } = useAction();
  const [inviting, setInviting] = useState(false);

  return (
    <>
      <PageHeader title="Rôles, accès et journal">
        <Button tone="primary" className="ml-auto" disabled={!canWrite} onClick={() => setInviting(true)}>
          Ajouter un membre
        </Button>
      </PageHeader>
      <div className="grid gap-3.5 xl:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-3.5">
          <Card className="overflow-hidden">
            <CardHeader title="Équipe interne">
              <span className="text-xs text-muted">Connexion par téléphone et mot de passe</span>
            </CardHeader>
            <ResourceView state={members} onRetry={members.reload}>
              {(list) => (
                <DataTable<Member>
                  rows={list}
                  rowKey={(m) => m.id}
                  columns={[
                    { key: "name", header: "Membre", render: (m) => <span className="flex flex-col"><b>{m.name}</b><span className="text-xs text-muted">{m.email ?? m.phone}</span></span> },
                    {
                      key: "role",
                      header: "Rôle",
                      render: (m) => (
                        <select
                          aria-label={`Rôle de ${m.name}`}
                          className={`${fieldClass} h-8 w-48`}
                          value={m.roleId}
                          disabled={!canWrite || busy || !roles.data}
                          onChange={async (e) => {
                            const r = await run(() => rbacUseCases.changeRole(m, e.target.value, actingId), "Rôle modifié.");
                            if (r !== undefined) members.reload();
                          }}
                        >
                          {(roles.data ?? []).map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.displayName}
                            </option>
                          ))}
                          {roles.data && !roles.data.some((r) => r.id === m.roleId) ? <option value={m.roleId}>{m.roleName}</option> : null}
                        </select>
                      ),
                    },
                    { key: "status", header: "Statut", render: (m) => <Tag tone={STATUS_TONE[m.status]}>{ADMIN_STATUS_LABELS[m.status]}</Tag> },
                    {
                      key: "rm",
                      header: "",
                      render: (m) =>
                        m.status === "active" ? (
                          <Button
                            size="sm"
                            tone="ghost"
                            disabled={!canWrite || busy}
                            onClick={async () => {
                              const r = await run(() => rbacUseCases.deactivate(m, actingId), `${m.name} n’a plus accès au back-office.`);
                              if (r !== undefined) members.reload();
                            }}
                          >
                            Désactiver
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            disabled={!canWrite || busy}
                            onClick={async () => {
                              const r = await run(() => rbacUseCases.reactivate(m), `${m.name} a de nouveau accès.`);
                              if (r !== undefined) members.reload();
                            }}
                          >
                            Réactiver
                          </Button>
                        ),
                    },
                  ]}
                />
              )}
            </ResourceView>
          </Card>
          <Card className="overflow-hidden">
            <CardHeader title="Ce que chaque rôle peut faire" />
            <ResourceView state={roles} onRetry={roles.reload}>
              {(list) => (
                <div className="flex flex-col gap-3 p-4">
                  {list.map((r) => (
                    <details key={r.id} className="rounded-[10px] border border-line px-3 py-2">
                      <summary className="cursor-pointer text-[13px] font-bold">
                        {r.displayName} <span className="font-normal text-muted">· {r.permissions.length} permissions</span>
                      </summary>
                      {r.description ? <p className="mt-1 text-xs text-muted">{r.description}</p> : null}
                      <div className="mt-2 flex flex-col gap-1.5">
                        {groupByModule(r.permissions).map(([module, perms]) => (
                          <div key={module} className="text-xs">
                            <b>{module}</b> : <span className="text-muted">{perms.map((p) => p.code).join(", ")}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </ResourceView>
            <Note className="m-4">La création de rôles et la modification de leurs permissions sont possibles côté backend (POST /roles, PATCH /roles/:id/permissions) : écran à venir.</Note>
          </Card>
        </div>
        <Card className="overflow-hidden">
          <CardHeader title="Journal des actions">
            <span className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <Chip key={c} on={category === c} onClick={() => setCategory(c)}>
                  {c === "all" ? "Tout" : c}
                </Chip>
              ))}
            </span>
          </CardHeader>
          <ResourceView state={audit} onRetry={audit.reload}>
            {(rows) => (
              <DataTable<AuditEntry>
                rows={rows}
                rowKey={(a) => a.id}
                columns={[
                  { key: "at", header: "Quand", render: (a) => dateTime(a.at) },
                  { key: "who", header: "Qui", render: (a) => a.actor },
                  { key: "cat", header: "Type", render: (a) => <Tag>{a.category}</Tag> },
                  { key: "action", header: "Action", render: (a) => <span className="whitespace-normal">{a.action}</span> },
                ]}
              />
            )}
          </ResourceView>
          <MissingRoutes area="rbac" className="m-4" />
        </Card>
      </div>
      {inviting ? (
        <InviteDialog
          members={members.data ?? []}
          roles={roles.data ?? []}
          onClose={() => setInviting(false)}
          onDone={() => {
            setInviting(false);
            members.reload();
          }}
        />
      ) : null}
    </>
  );
}

function InviteDialog({ members, roles, onClose, onDone }: { members: Member[]; roles: RoleInfo[]; onClose: () => void; onDone: () => void }) {
  const [m, setM] = useState<NewMember>({ firstName: "", lastName: "", phone: "", password: "", roleId: roles[0]?.id ?? "" });
  const { busy, run } = useAction();
  const set = <K extends keyof NewMember>(k: K, v: NewMember[K]) => setM({ ...m, [k]: v });
  return (
    <Dialog
      open
      title="Ajouter un membre"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button
            tone="primary"
            busy={busy}
            onClick={async () => {
              const r = await run(() => rbacUseCases.register(m, members), "Compte créé : transmettez-lui son mot de passe de façon sûre.");
              if (r !== undefined) onDone();
            }}
          >
            Créer le compte
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Prénom">
          <input className={fieldClass} value={m.firstName} onChange={(e) => set("firstName", e.target.value)} />
        </Field>
        <Field label="Nom">
          <input className={fieldClass} value={m.lastName} onChange={(e) => set("lastName", e.target.value)} />
        </Field>
      </div>
      <Field label="Téléphone">
        <input className={fieldClass} type="tel" value={m.phone} onChange={(e) => set("phone", e.target.value)} />
      </Field>
      <Field label="Mot de passe provisoire" hint="8 caractères minimum.">
        <input className={fieldClass} type="password" autoComplete="new-password" value={m.password} onChange={(e) => set("password", e.target.value)} />
      </Field>
      <Field label="Rôle">
        <select className={fieldClass} value={m.roleId} onChange={(e) => set("roleId", e.target.value)}>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.displayName}
            </option>
          ))}
        </select>
      </Field>
    </Dialog>
  );
}
