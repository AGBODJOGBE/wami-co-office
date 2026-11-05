import type { Activity, Establishment, EstablishmentStatus } from "./establishment";

export interface EstablishmentsRepository {
  list(activity: Activity | "all"): Promise<Establishment[]>;
  setCommission(id: string, rate: number | null): Promise<Establishment>;
  setStatus(id: string, status: EstablishmentStatus, reason: string): Promise<Establishment>;
}
