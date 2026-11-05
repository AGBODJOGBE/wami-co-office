import { guard } from "@/shared/lib/result";
import type { PaymentFilter } from "../domain/payment";
import type { PaymentsRepository } from "../domain/payments.repository";
import { HttpPaymentsRepository } from "./payments.http-repository";

export function createPaymentsUseCases(repo: PaymentsRepository) {
  return { list: (f: PaymentFilter) => guard(() => repo.list(f)) };
}

export const paymentsUseCases = createPaymentsUseCases(new HttpPaymentsRepository());
