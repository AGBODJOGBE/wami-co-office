import { fail, guard } from "@/shared/lib/result";
import { cancelBlocker, type B2cDelivery } from "../domain/b2c-delivery";
import type { B2cDeliveriesRepository } from "../domain/b2c-deliveries.repository";
import { HttpB2cDeliveriesRepository } from "./b2c-deliveries.http-repository";

export function createB2cDeliveriesUseCases(repo: B2cDeliveriesRepository) {
  return {
    list: () => guard(() => repo.list()),
    cancel: async (d: B2cDelivery, reason: string) => {
      const blocker = cancelBlocker(d, reason);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.cancel(d.id, reason.trim()));
    },
  };
}

export const b2cDeliveriesUseCases = createB2cDeliveriesUseCases(new HttpB2cDeliveriesRepository());
