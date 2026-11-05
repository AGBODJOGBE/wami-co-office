import type { PendingPartner } from "./partner";

export interface PartnersRepository {
  pending(): Promise<PendingPartner[]>;
  validate(id: string): Promise<void>;
}
