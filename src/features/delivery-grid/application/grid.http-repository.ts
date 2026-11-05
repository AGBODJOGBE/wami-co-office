import { API } from "@/shared/config/api-routes";
import { ApiError } from "@/shared/lib/result";
import { http } from "@/shared/lib/http";
import { PARCEL_CATEGORIES, type Grid, type GridDraft, type ParcelCategory } from "../domain/grid";
import type { GridRepository } from "../domain/grid.repository";

/** Grille renvoyée par `GET /api/admin/pricing-grid/active` (backend wami-co). */
export interface BackendGrid {
  id: string;
  version: string;
  isActive: boolean;
  baseFees: Record<ParcelCategory, number>;
  sensitivitySurcharges: { FRAGILE?: number };
  zonePricingMatrix: Array<{ originZoneCode: string; destinationZoneCode: string; fee: number }>;
  distanceRanges: Array<{ minKm: number; maxKm: number | null; fee: number }>;
  weightSurchargePerKg: number;
  urgencyMultipliers: { EXPRESS: number; SAME_DAY: number };
  insuranceRate: number;
  insuranceMinimum: number;
  codFeeRate: number;
  codFeeMinimum: number;
  activatedAt: string | null;
}

export const toGrid = (g: BackendGrid): Grid => ({
  id: g.id,
  version: g.version,
  active: g.isActive,
  baseFees: Object.fromEntries(PARCEL_CATEGORIES.map((c) => [c, g.baseFees[c] ?? 0])) as Record<ParcelCategory, number>,
  fragileSurcharge: g.sensitivitySurcharges.FRAGILE ?? 0,
  zones: g.zonePricingMatrix.map((z) => ({ origin: z.originZoneCode, destination: z.destinationZoneCode, fee: z.fee })),
  distanceRanges: g.distanceRanges.map((r) => ({ minKm: r.minKm, maxKm: r.maxKm, fee: r.fee })),
  weightSurchargePerKg: g.weightSurchargePerKg,
  expressMultiplier: g.urgencyMultipliers.EXPRESS,
  sameDayMultiplier: g.urgencyMultipliers.SAME_DAY,
  insuranceRate: g.insuranceRate,
  insuranceMinimum: g.insuranceMinimum,
  codFeeRate: g.codFeeRate,
  codFeeMinimum: g.codFeeMinimum,
  activatedAt: g.activatedAt,
});

/** Corps de `POST /api/admin/pricing-grid`. */
export const toBody = (d: GridDraft) => ({
  version: d.version.trim(),
  baseFees: d.baseFees,
  sensitivitySurcharges: { FRAGILE: d.fragileSurcharge },
  zonePricingMatrix: d.zones.map((z) => ({ originZoneCode: z.origin.trim().toUpperCase(), destinationZoneCode: z.destination.trim().toUpperCase(), fee: z.fee })),
  distanceRanges: d.distanceRanges,
  weightSurchargePerKg: d.weightSurchargePerKg,
  urgencyMultipliers: { EXPRESS: d.expressMultiplier, SAME_DAY: d.sameDayMultiplier },
  insuranceRate: d.insuranceRate,
  insuranceMinimum: d.insuranceMinimum,
  codFeeRate: d.codFeeRate,
  codFeeMinimum: d.codFeeMinimum,
});

export class HttpGridRepository implements GridRepository {
  async active() {
    try {
      return toGrid(await http.get<BackendGrid>(API.pricingAdmin.activeGrid));
    } catch (e) {
      // 404 : aucune grille publiée pour l'instant.
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  }
  async publish(d: GridDraft) {
    await http.post(API.pricingAdmin.grid, toBody(d));
  }
}
