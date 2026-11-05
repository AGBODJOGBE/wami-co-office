import type { AppUser, UserFilter } from "./user";

export interface UsersRepository {
  list(filter: UserFilter): Promise<AppUser[]>;
}
