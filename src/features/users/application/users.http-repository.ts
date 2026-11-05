import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { AppUser, UserFilter } from "../domain/user";
import type { UsersRepository } from "../domain/users.repository";

/** Élément de `GET /api/admin/users` (backend wami-co). */
export interface BackendUser {
  userId: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export const toUser = (u: BackendUser): AppUser => ({ id: u.userId, name: `${u.firstName} ${u.lastName}`.trim(), phone: u.phoneNumber, email: u.email, role: u.role, active: u.isActive, createdAt: u.createdAt });

export class HttpUsersRepository implements UsersRepository {
  async list(f: UserFilter) {
    const { users } = await http.get<{ users: BackendUser[] }>(API.users.list, { search: f.q.trim() || undefined, role: f.role || undefined, isActive: f.state === "all" ? undefined : f.state === "active" });
    return users.map(toUser);
  }
}
