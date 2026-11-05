import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { AdminStatus, AuditEntry, Member, NewMember, Permission, RoleInfo } from "../domain/rbac";
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
  async permissions() {
    const { permissions } = await http.get<{ permissions: Record<string, Array<{ id: string; code: string; name: string }>> }>(API.rbac.permissions);
    return Object.entries(permissions).flatMap(([module, list]) => list.map((p): Permission => ({ id: p.id, code: p.code, name: p.name, module })));
  }
  async createRole(name: string, displayName: string, description: string, permissionIds: string[]) {
    await http.post(API.rbac.roles, { name, displayName, description, permissionIds });
  }
  async updateRolePermissions(roleId: string, add: string[], remove: string[]) {
    await http.patch(API.rbac.role(roleId), { add, remove });
  }
  async grantPermission(adminId: string, code: string) {
    await http.post(API.rbac.grantPermission(adminId), { permissionCode: code });
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
