import type { Role } from "@/shared/auth/permissions";
import { fail, guard, type Result } from "@/shared/lib/result";
import { inviteBlocker, roleChangeBlocker, type AuditEntry, type Member } from "../domain/rbac";
import type { RbacRepository } from "../domain/rbac.repository";
import { HttpRbacRepository } from "./rbac.http-repository";

export function createRbacUseCases(repo: RbacRepository) {
  return {
    members: () => guard(() => repo.members()),
    invite: (name: string, email: string, role: Role, members: Member[]): Promise<Result<Member>> => {
      const blocker = inviteBlocker(name, email, members);
      if (blocker) return Promise.resolve(fail("validation", blocker));
      return guard(() => repo.invite(name.trim(), email.trim().toLowerCase(), role));
    },
    changeRole: (m: Member, role: Role, members: Member[], actingId: string): Promise<Result<Member>> => {
      const blocker = roleChangeBlocker(m, role, members, actingId);
      if (blocker) return Promise.resolve(fail("validation", blocker));
      return guard(() => repo.changeRole(m.id, role));
    },
    /** Renvoie l'identifiant du membre retiré. */
    remove: (m: Member, members: Member[], actingId: string): Promise<Result<string>> => {
      const blocker = roleChangeBlocker(m, null, members, actingId);
      if (blocker) return Promise.resolve(fail("validation", blocker));
      return guard(async () => {
        await repo.remove(m.id);
        return m.id;
      });
    },
    audit: (category: AuditEntry["category"] | "all") => guard(() => repo.audit(category)),
  };
}

export const rbacUseCases = createRbacUseCases(new HttpRbacRepository());
