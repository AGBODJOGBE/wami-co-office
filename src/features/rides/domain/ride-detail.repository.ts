import type { MatchingView, RideDetail, Section, SettlementView } from "./ride-detail";

export interface RideDetailRepository {
  detail(rideId: string): Promise<RideDetail>;
  /** Règlement de la garantie d'une course programmée (aucun si la course n'en a pas). */
  settlement(rideId: string): Promise<SettlementView | null>;
}

export type { MatchingView, Section };
