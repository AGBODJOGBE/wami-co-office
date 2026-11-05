import type { AuditEntry, Member, NewMember, RoleInfo } from "./rbac";

export interface RbacRepository {
  members(): Promise<Member[]>;
  roles(): Promise<RoleInfo[]>;
  register(m: NewMember): Promise<void>;
  changeRole(adminId: string, roleId: string): Promise<void>;
  deactivate(adminId: string): Promise<void>;
  reactivate(adminId: string): Promise<void>;
  /** Route absente du backend : servie par le faux backend. */
  audit(category: AuditEntry["category"] | "all"): Promise<AuditEntry[]>;
}
