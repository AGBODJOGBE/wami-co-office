import type { Role } from "@/shared/auth/permissions";
import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { AuditEntry, Member } from "../domain/rbac";
import type { RbacRepository } from "../domain/rbac.repository";

export class HttpRbacRepository implements RbacRepository {
  members() {
    return http.get<Member[]>(API.rbac.members);
  }
  invite(name: string, email: string, role: Role) {
    return http.post<Member>(API.rbac.members, { name, email, role });
  }
  changeRole(id: string, role: Role) {
    return http.patch<Member>(API.rbac.member(id), { role });
  }
  async remove(id: string) {
    await http.delete<unknown>(API.rbac.member(id));
  }
  audit(category: AuditEntry["category"] | "all") {
    return http.get<AuditEntry[]>(API.rbac.audit, { category: category === "all" ? undefined : category });
  }
}
