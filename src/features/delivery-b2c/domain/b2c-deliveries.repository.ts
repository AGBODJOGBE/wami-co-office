import type { B2cDelivery } from "./b2c-delivery";

export interface B2cDeliveriesRepository {
  list(): Promise<B2cDelivery[]>;
  cancel(id: string, reason: string): Promise<void>;
}
