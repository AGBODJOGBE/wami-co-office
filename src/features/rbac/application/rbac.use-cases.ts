import { fail, guard } from "@/shared/lib/result";
import { accessChangeBlocker, deactivateBlocker, reactivateBlocker, registerBlocker, type AuditEntry, type Member, type NewMember } from "../domain/rbac";
import type { RbacRepository } from "../domain/rbac.repository";
import { HttpRbacRepository } from "./rbac.http-repository";

export function createRbacUseCases(repo: RbacRepository) {
  return {
    members: () => guard(() => repo.members()),
    roles: () => guard(() => repo.roles()),
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
