import { fail, guard, type Result } from "@/shared/lib/result";
import { cancelBlocker, lateMinutes, type Delivery, type DeliveryFilter } from "../domain/delivery";
import type { DeliveryRepository } from "../domain/delivery.repository";
import { HttpDeliveryRepository } from "./delivery.http-repository";

export function createDeliveryUseCases(repo: DeliveryRepository, clock: () => Date = () => new Date()) {
  return {
    list: async (filter: DeliveryFilter): Promise<Result<Delivery[]>> => {
      const r = await guard(() => repo.list(filter));
      if (!r.ok || !filter.onlyLate) return r;
      const now = clock();
      return { ok: true, value: r.value.filter((d) => lateMinutes(d, now) > 0) };
    },
    cancel: (d: Delivery, reason: string): Promise<Result<Delivery>> => {
      const blocker = cancelBlocker(d, reason);
      if (blocker) return Promise.resolve(fail("validation", blocker));
      return guard(() => repo.cancel(d.id, reason.trim()));
    },
  };
}

export const deliveryUseCases = createDeliveryUseCases(new HttpDeliveryRepository());
