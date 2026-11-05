"use client";

import { useState } from "react";
import { useAction } from "@/shared/hooks/use-action";
import { useResource } from "@/shared/hooks/use-resource";
import { Dialog } from "@/shared/ui/dialog";
import { Button, Field, fieldClass, Note } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { rbacUseCases } from "../application/rbac.use-cases";
import { PROTECTED_ROLE, groupByModule, type Member, type Permission, type RoleInfo } from "../domain/rbac";

/** Cases à cocher des permissions, regroupées par module. */
function PermissionPicker({ all, selected, onChange, locked }: { all: Permission[]; selected: string[]; onChange: (codes: string[]) => void; locked: string[] }) {
  const toggle = (code: string) => onChange(selected.includes(code) ? selected.filter((c) => c !== code) : [...selected, code]);
  return (
    <div className="flex max-h-72 flex-col gap-2 overflow-auto rounded-[10px] border border-line p-3">
      {groupByModule(all).map(([module, perms]) => (
        <fieldset key={module} className="text-xs">
          <legend className="font-bold">{module}</legend>
          <div className="mt-1 grid gap-1 sm:grid-cols-2">
            {perms.map((p) => (
              <label key={p.code} className="flex items-center gap-2">
                <input type="checkbox" checked={selected.includes(p.code)} disabled={locked.includes(p.code)} onChange={() => toggle(p.code)} />
                <span title={p.name}>{p.code}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

/** Création d'un rôle (config absente) ou modification des permissions d'un rôle existant. */
export function RoleDialog({ role, roles, onClose, onDone }: { role: RoleInfo | null; roles: RoleInfo[]; onClose: () => void; onDone: () => void }) {
  const all = useResource(() => rbacUseCases.permissions(), "permissions");
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<string[]>(role ? role.permissions.map((p) => p.code) : []);
  const { busy, run } = useAction();
  // Le rôle protégé ne perd aucune permission.
  const locked = role?.name === PROTECTED_ROLE ? role.permissions.map((p) => p.code) : [];

  return (
    <Dialog
      open
      title={role ? `Permissions · ${role.displayName}` : "Nouveau rôle"}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button
            tone="primary"
            busy={busy}
            disabled={!all.data}
            onClick={async () => {
              const r = await run(
                () => (role ? rbacUseCases.updateRolePermissions(role, selected) : rbacUseCases.createRole({ name, displayName, description, permissionCodes: selected }, roles, all.data ?? [])),
                role ? "Permissions modifiées : elles s’appliquent à la prochaine connexion des membres." : "Rôle créé.",
              );
              if (r !== undefined) onDone();
            }}
          >
            Enregistrer
          </Button>
        </>
      }
    >
      {!role ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Identifiant" hint="Ex. SUPPORT_N2 (mis en majuscules).">
              <input className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Nom affiché">
              <input className={fieldClass} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </Field>
          </div>
          <Field label="Description">
            <input className={fieldClass} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
        </>
      ) : null}
      <ResourceView state={all} onRetry={all.reload}>
        {(list) => <PermissionPicker all={list} selected={selected} onChange={setSelected} locked={locked} />}
      </ResourceView>
      {role?.name === PROTECTED_ROLE ? <Note>Le rôle SUPER_ADMIN peut recevoir de nouvelles permissions mais n’en perd aucune.</Note> : null}
      <Note>{selected.length} permission{selected.length > 1 ? "s" : ""} sélectionnée{selected.length > 1 ? "s" : ""}.</Note>
    </Dialog>
  );
}

/** Octroi d'une permission supplémentaire à un administrateur, en plus de son rôle. */
export function GrantDialog({ member, actingId, onClose }: { member: Member; actingId: string; onClose: () => void }) {
  const all = useResource(() => rbacUseCases.permissions(), "permissions");
  const [code, setCode] = useState("");
  const { busy, run } = useAction();
  return (
    <Dialog
      open
      title={`Accorder une permission · ${member.name}`}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button
            tone="primary"
            busy={busy}
            onClick={async () => {
              const r = await run(() => rbacUseCases.grantPermission(member, code, actingId), "Permission accordée.");
              if (r !== undefined) onClose();
            }}
          >
            Accorder
          </Button>
        </>
      }
    >
      <ResourceView state={all} onRetry={all.reload}>
        {(list) => (
          <Field label="Permission" hint="S’ajoute à celles de son rôle.">
            <select className={fieldClass} value={code} onChange={(e) => setCode(e.target.value)}>
              <option value="">Choisir…</option>
              {list.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.code}
                </option>
              ))}
            </select>
          </Field>
        )}
      </ResourceView>
    </Dialog>
  );
}
