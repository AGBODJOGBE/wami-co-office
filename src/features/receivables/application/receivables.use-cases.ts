import { fail, guard } from "@/shared/lib/result";
import type { ReceivablesRepository } from "../domain/receivables.repository";
import { HttpReceivablesRepository } from "./receivables.http-repository";

export function createReceivablesUseCases(repo: ReceivablesRepository) {
  return {
    revenue: (from?: string, to?: string) => (from && to && new Date(to) < new Date(from) ? Promise.resolve(fail<never>("validation", "La fin de période précède le début.")) : guard(() => repo.revenue(from, to))),
    overview: () => guard(() => repo.overview()),
    debts: () => guard(() => repo.debts()),
    debtLines: (driverId: string) => guard(() => repo.debtLines(driverId)),
  };
}

export const receivablesUseCases = createReceivablesUseCases(new HttpReceivablesRepository());
