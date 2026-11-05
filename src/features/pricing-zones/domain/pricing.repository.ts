import type { Commission, Tariff, Zone } from "./pricing";

export interface PricingRepository {
  zones(): Promise<Zone[]>;
  tariffs(zoneId: string): Promise<Tariff[]>;
  saveTariff(zoneId: string, t: Tariff): Promise<Tariff>;
  commissions(): Promise<Commission[]>;
}
