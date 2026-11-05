import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { AdminStatus, AuditEntry, Member, NewMember, RoleInfo } from "../domain/rbac";
import type { RbacRepository } from "../domain/rbac.repository";

/** Élément de `GET /api/admin/admins` (backend wami-co). */
export interface BackendAdmin {
  adminId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phoneNumber: string;
  roleId: string;
  roleName: string;
  status: string;
  createdAt: string;
}

const STATUS: Record<string, AdminStatus> = { ACTIVE: "active", SUSPENDED: "suspended", DEACTIVATED: "deactivated" };

export function toMember(a: BackendAdmin): Member {
  return {
    id: a.adminId,
    name: `${a.firstName} ${a.lastName}`.trim(),
    email: a.email,
    phone: a.phoneNumber,
    roleId: a.roleId,
    roleName: a.roleName,
    status: STATUS[a.status] ?? "active",
    createdAt: a.createdAt,
  };
}

export class HttpRbacRepository implements RbacRepository {
  async members() {
    const { admins } = await http.get<{ admins: BackendAdmin[] }>(API.rbac.members, { limit: 100 });
    return admins.map(toMember);
  }
  async roles() {
    const { roles } = await http.get<{ roles: RoleInfo[] }>(API.rbac.roles);
    return roles;
  }
  async register(m: NewMember) {
    await http.post(API.rbac.register, { phone: m.phone, password: m.password, firstName: m.firstName, lastName: m.lastName, roleId: m.roleId });
  }
  async changeRole(adminId: string, roleId: string) {
    await http.patch(API.rbac.changeRole(adminId), { roleId });
  }
  async deactivate(adminId: string) {
    await http.patch(API.rbac.deactivate(adminId));
  }
  async reactivate(adminId: string) {
    await http.patch(API.rbac.reactivate(adminId));
  }
  audit(category: AuditEntry["category"] | "all") {
    return http.get<AuditEntry[]>(API.rbac.audit, { category: category === "all" ? undefined : category });
  }
}
