import type { ServiceCategory } from "./vtc";

export interface VtcRepository {
  categories(): Promise<ServiceCategory[]>;
  setActive(key: string, active: boolean): Promise<ServiceCategory>;
}
