import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { B2bAccount, Invoice } from "../domain/b2b";
import type { B2bRepository } from "../domain/b2b.repository";

export class HttpB2bRepository implements B2bRepository {
  accounts() {
    return http.get<B2bAccount[]>(API.deliveryB2b.accounts);
  }
  invoices(accountId: string) {
    return http.get<Invoice[]>(API.deliveryB2b.invoices(accountId));
  }
  update(accountId: string, patch: Partial<Pick<B2bAccount, "creditLimit" | "status">>) {
    return http.patch<B2bAccount>(API.deliveryB2b.account(accountId), patch);
  }
}
