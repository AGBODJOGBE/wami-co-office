import type { Payment, PaymentFilter } from "./payment";

export interface PaymentsRepository {
  list(filter: PaymentFilter): Promise<Payment[]>;
}
