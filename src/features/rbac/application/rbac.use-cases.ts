import { fail, guard } from "@/shared/lib/result";
import { grantBlocker, permissionDiff, permissionUpdateBlocker, roleDraftBlocker, accessChangeBlocker, deactivateBlocker, reactivateBlocker, registerBlocker, type AuditEntry, type Member, type NewMember, type RoleDraft, type RoleInfo } from "../domain/rbac";
import type { RbacRepository } from "../domain/rbac.repository";
import { HttpRbacRepository } from "./rbac.http-repository";

export function createRbacUseCases(repo: RbacRepository) {
  return {
    members: () => guard(() => repo.members()),
    roles: () => guard(() => repo.roles()),
    permissions: () => guard(() => repo.permissions()),
    createRole: async (d: RoleDraft, roles: RoleInfo[], all: Array<{ id: string; code: string }>) => {
      const blocker = roleDraftBlocker(d, roles);
      if (blocker) return fail("validation", blocker);
      const ids = all.filter((p) => d.permissionCodes.includes(p.code)).map((p) => p.id);
      return guard(() => repo.createRole(d.name.trim().toUpperCase(), d.displayName.trim(), d.description.trim(), ids));
    },
    updateRolePermissions: async (role: RoleInfo, selected: string[]) => {
      const blocker = permissionUpdateBlocker(role, selected);
      if (blocker) return fail("validation", blocker);
      const { add, remove } = permissionDiff(role, selected);
      return guard(() => repo.updateRolePermissions(role.id, add, remove));
    },
    grantPermission: async (m: Member, code: string, actingId: string) => {
      const blocker = grantBlocker(m, code, actingId);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.grantPermission(m.id, code));
    },
    register: async (m: NewMember, members: Member[]) => {
      const blocker = registerBlocker(m, members);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.register({ ...m, firstName: m.firstName.trim(), lastName: m.lastName.trim(), phone: m.phone.trim() }));
    },
    changeRole: async (m: Member, roleId: string, actingId: string) => {
      const blocker = accessChangeBlocker(m, actingId);
      if (blocker) return fail("validation", blocker);
      if (roleId === m.roleId) return fail("validation", "C’est déjà son rôle.");
      return guard(() => repo.changeRole(m.id, roleId));
    },
    deactivate: async (m: Member, actingId: string) => {
      const blocker = deactivateBlocker(m, actingId);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.deactivate(m.id));
    },
    reactivate: async (m: Member) => {
      const blocker = reactivateBlocker(m);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.reactivate(m.id));
    },
    audit: (category: AuditEntry["category"] | "all") => guard(() => repo.audit(category)),
  };
}

export const rbacUseCases = createRbacUseCases(new HttpRbacRepository());
