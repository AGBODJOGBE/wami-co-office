import type { Role } from "@/shared/auth/permissions";
import type { AuditEntry, Member } from "./rbac";

export interface RbacRepository {
  members(): Promise<Member[]>;
  invite(name: string, email: string, role: Role): Promise<Member>;
  changeRole(id: string, role: Role): Promise<Member>;
  remove(id: string): Promise<void>;
  audit(category: AuditEntry["category"] | "all"): Promise<AuditEntry[]>;
}
