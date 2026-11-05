import type { B2bAccount, Invoice } from "./b2b";

export interface B2bRepository {
  accounts(): Promise<B2bAccount[]>;
  invoices(accountId: string): Promise<Invoice[]>;
  update(accountId: string, patch: Partial<Pick<B2bAccount, "creditLimit" | "status">>): Promise<B2bAccount>;
}
