import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { PromoCode, PromoService } from "../domain/promo-code";
import type { PromoCodesRepository } from "../domain/promo-codes.repository";

/** Code promo renvoyé par `GET /api/admin/promo-codes` (backend wami-co) : champs utilisés. */
export interface BackendPromo {
  id: string;
  code: string;
  campaignName: string;
  displayText?: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT" | "CASHBACK" | "FREE_RIDE";
  discountValue: number;
  maxDiscountAmount: number | null;
  startDate: string;
  endDate: string;
  maxTotalUsages: number | null;
  currentUsages: number;
  vertical: "TRANSPORT" | "DELIVERY_B2B" | "DELIVERY_B2C";
  fundedBy: "WAMI" | "PARTNER";
  usageNumber: number | null;
  isActive: boolean;
}

const SERVICES: Record<BackendPromo["vertical"], PromoService[]> = { TRANSPORT: ["ride"], DELIVERY_B2C: ["delivery"], DELIVERY_B2B: ["delivery"] };

export function toPromo(p: BackendPromo): PromoCode {
  return {
    id: p.id,
    code: p.code,
    description: p.displayText || p.campaignName,
    kind: p.discountType === "PERCENTAGE" ? "percent" : "fixed",
    value: p.discountValue,
    cap: p.maxDiscountAmount,
    maxUses: p.maxTotalUsages ?? Number.MAX_SAFE_INTEGER,
    used: p.currentUsages,
    services: SERVICES[p.vertical] ?? ["ride"],
    startsAt: p.startDate,
    endsAt: p.endDate,
    fundedBy: p.fundedBy === "WAMI" ? "wami" : "shared",
    firstOrderOnly: p.usageNumber === 1,
    active: p.isActive,
  };
}

/** Corps de `POST /api/admin/promo-codes` : le formulaire du back-office remplit le minimum, le reste prend des valeurs neutres. */
export function toCreateBody(p: PromoCode) {
  const deliveryOnly = p.services.length > 0 && p.services.every((s) => s === "delivery" || s === "meal");
  return {
    code: p.code,
    campaignName: p.description || p.code,
    displayText: p.description || p.code,
    discountType: p.kind === "percent" ? "PERCENTAGE" : "FIXED_AMOUNT",
    discountValue: p.value,
    maxDiscountAmount: p.cap,
    startDate: p.startsAt,
    endDate: p.endsAt,
    maxTotalUsages: p.maxUses,
    maxUsagesPerUser: 1,
    minOrderAmount: null,
    targetZones: [],
    vehicleTypes: [],
    timeWindows: [],
    userType: p.firstOrderOnly ? "NEW" : "ALL",
    usageNumber: p.firstOrderOnly ? 1 : null,
    vertical: deliveryOnly ? "DELIVERY_B2C" : "TRANSPORT",
    campaignType: p.firstOrderOnly ? "PERFORMANCE" : "GROWTH",
    fundedBy: p.fundedBy === "wami" ? "WAMI" : "PARTNER",
    sponsorId: null,
    sponsoredBudget: null,
    dailySpendingLimit: null,
    channel: "IN_APP",
    codeType: "USER",
    targeting: "ALL",
    targetUserIds: [],
    isPushed: false,
    objective: p.firstOrderOnly ? "ACQUISITION" : "RETENTION",
    isActive: p.active,
  };
}

export class HttpPromoCodesRepository implements PromoCodesRepository {
  async list() {
    const promos = await http.get<BackendPromo[]>(API.promoCodes.list);
    return promos.map(toPromo);
  }
  async create(p: PromoCode) {
    await http.post(API.promoCodes.list, toCreateBody(p));
  }
  async toggle(p: PromoCode) {
    await http.patch(API.promoCodes.toggle(p.id));
  }
}
