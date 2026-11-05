"use client";

import { useState } from "react";
import { useResource } from "@/shared/hooks/use-resource";
import { dayMonth } from "@/shared/lib/format";
import { DataTable } from "@/shared/ui/data-table";
import { Card, fieldClass, PageHeader, Segmented, Tag } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { usersUseCases } from "../application/users.use-cases";
import { USER_ROLE_LABELS, roleLabel, type AppUser, type UserFilter } from "../domain/user";

const STATES = [["all", "Tous"], ["active", "Actifs"], ["inactive", "Désactivés"]] as const;

export function UsersView() {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [state, setState] = useState<UserFilter["state"]>("all");
  const users = useResource(() => usersUseCases.list({ q, role, state }), `${q}|${role}|${state}`);

  return (
    <>
      <PageHeader title="Utilisateurs">
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <label className="w-64">
            <span className="sr-only">Rechercher un utilisateur</span>
            <input className={fieldClass} placeholder="Nom, téléphone, e-mail…" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <select aria-label="Rôle" className={`${fieldClass} w-44`} value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">Tous les rôles</option>
            {Object.entries(USER_ROLE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <Segmented label="État du compte" options={STATES} value={state} onChange={setState} />
        </div>
      </PageHeader>
      <Card className="overflow-hidden">
        <ResourceView state={users} onRetry={users.reload}>
          {(rows) => (
            <DataTable<AppUser>
              rows={rows}
              rowKey={(u) => u.id}
              empty="Aucun utilisateur."
              columns={[
                { key: "n", header: "Nom", render: (u) => <b>{u.name}</b> },
                { key: "p", header: "Téléphone", render: (u) => u.phone },
                { key: "e", header: "E-mail", render: (u) => u.email ?? "—" },
                { key: "r", header: "Rôle", render: (u) => roleLabel(u.role) },
                { key: "c", header: "Inscrit le", render: (u) => dayMonth(u.createdAt) },
                { key: "s", header: "", render: (u) => (u.active ? null : <Tag tone="bad">Désactivé</Tag>) },
              ]}
            />
          )}
        </ResourceView>
      </Card>
    </>
  );
}
