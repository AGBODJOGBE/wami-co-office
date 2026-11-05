"use client";

import { useState } from "react";
import { MODULES, ROLES, ROLE_LABELS, accessOf, type Role } from "@/shared/auth/permissions";
import { useSession } from "@/shared/auth/session.store";
import { useAction } from "@/shared/hooks/use-action";
import { useResource } from "@/shared/hooks/use-resource";
import { ago, dateTime } from "@/shared/lib/format";
import { NAVIGATION } from "@/shared/config/navigation";
import { useCanWrite } from "@/shared/ui/app-shell";
import { DataTable } from "@/shared/ui/data-table";
import { Dialog } from "@/shared/ui/dialog";
import { Button, Card, CardHeader, Chip, Field, fieldClass, Note, PageHeader, Tag } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { rbacUseCases } from "../application/rbac.use-cases";
import type { AuditEntry, Member } from "../domain/rbac";

const MODULE_LABEL = new Map(NAVIGATION.flatMap((g) => g.items).map((i) => [i.module, i.label] as const));
const CATEGORIES: Array<AuditEntry["category"] | "all"> = ["all", "Argent", "Comptes", "Réglages", "Opérations"];

export function RbacView() {
  const members = useResource(() => rbacUseCases.members(), "members");
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
          Inviter un membre
        </Button>
      </PageHeader>
      <div className="grid gap-3.5 xl:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-3.5">
          <Card className="overflow-hidden">
            <CardHeader title="Équipe interne">
              <span className="text-xs text-muted">Connexion par e-mail et code à usage unique</span>
            </CardHeader>
            <ResourceView state={members} onRetry={members.reload}>
              {(list) => (
                <DataTable<Member>
                  rows={list}
                  rowKey={(m) => m.id}
                  columns={[
                    { key: "name", header: "Membre", render: (m) => <span className="flex flex-col"><b>{m.name}</b><span className="text-xs text-muted">{m.email}</span></span> },
                    {
                      key: "role",
                      header: "Rôle",
                      render: (m) => (
                        <select
                          aria-label={`Rôle de ${m.name}`}
                          className={`${fieldClass} h-8 w-48`}
                          value={m.role}
                          disabled={!canWrite || busy}
                          onChange={async (e) => {
                            const r = await run(() => rbacUseCases.changeRole(m, e.target.value as Role, list, actingId), "Rôle modifié.");
                            if (r) members.mutate((l) => l.map((x) => (x.id === r.id ? r : x)));
                          }}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABELS[r]}
                            </option>
                          ))}
                        </select>
                      ),
                    },
                    { key: "seen", header: "Dernière connexion", render: (m) => (m.invited ? <Tag tone="info">Invitation envoyée</Tag> : m.lastSeenAt ? ago(m.lastSeenAt) : "—") },
                    { key: "2fa", header: "Double auth.", render: (m) => <Tag tone={m.twoFactor ? "ok" : "bad"}>{m.twoFactor ? "Oui" : "Non"}</Tag> },
                    {
                      key: "rm",
                      header: "",
                      render: (m) => (
                        <Button
                          size="sm"
                          tone="ghost"
                          disabled={!canWrite || busy}
                          onClick={async () => {
                            const r = await run(() => rbacUseCases.remove(m, list, actingId), `${m.name} n’a plus accès au back-office.`);
                            if (r) members.mutate((l) => l.filter((x) => x.id !== m.id));
                          }}
                        >
                          Retirer
                        </Button>
                      ),
                    },
                  ]}
                />
              )}
            </ResourceView>
          </Card>
          <Card className="overflow-hidden">
            <CardHeader title="Ce que chaque rôle voit">
              <span className="text-xs text-muted">✓ agir · L lecture · — masqué</span>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left text-[11px] text-muted">
                      Module
                    </th>
                    {ROLES.map((r) => (
                      <th key={r} scope="col" className="px-3 py-2 text-left text-[11px] text-muted">
                        {ROLE_LABELS[r]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MODULES.filter((m) => MODULE_LABEL.has(m)).map((m) => (
                    <tr key={m} className="border-t border-field">
                      <td className="px-3 py-1.5">{MODULE_LABEL.get(m)}</td>
                      {ROLES.map((r) => {
                        const a = accessOf(r, m);
                        return (
                          <td key={r} className="px-3 py-1.5">
                            {a === "write" ? "✓" : a === "read" ? "L" : "—"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Note className="m-4">Matrice par défaut (shared/auth/permissions.ts). Rôles personnalisés et plafonds par rôle : à valider.</Note>
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
          <Note className="m-4">Journal non modifiable. Durée de conservation : à valider.</Note>
        </Card>
      </div>
      {inviting ? (
        <InviteDialog
          members={members.data ?? []}
          onClose={() => setInviting(false)}
          onDone={(m) => {
            members.mutate((l) => [...l, m]);
            setInviting(false);
          }}
        />
      ) : null}
    </>
  );
}

function InviteDialog({ members, onClose, onDone }: { members: Member[]; onClose: () => void; onDone: (m: Member) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("support");
  const { busy, run } = useAction();
  return (
    <Dialog
      open
      title="Inviter un membre"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button
            tone="primary"
            busy={busy}
            onClick={async () => {
              const r = await run(() => rbacUseCases.invite(name, email, role, members), "Invitation envoyée par e-mail.");
              if (r) onDone(r);
            }}
          >
            Inviter
          </Button>
        </>
      }
    >
      <Field label="Nom">
        <input className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="E-mail professionnel">
        <input className={fieldClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label="Rôle">
        <select className={fieldClass} value={role} onChange={(e) => setRole(e.target.value as Role)}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
      </Field>
    </Dialog>
  );
}
