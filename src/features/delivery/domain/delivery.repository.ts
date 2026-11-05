import type { Delivery, DeliveryFilter } from "./delivery";

export interface DeliveryRepository {
  list(filter: DeliveryFilter): Promise<Delivery[]>;
  cancel(id: string, reason: string): Promise<Delivery>;
}
