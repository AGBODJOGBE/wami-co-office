import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import { fromCentimes, toCentimes, type Plan, type PlanDraft, type QuotaPolicy } from "../domain/plan";
import type { PlansRepository } from "../domain/plans.repository";

/** Élément de `GET /api/admin/subscription-plans` (backend wami-co) ; `price` en centimes. */
export interface BackendPlan {
  planId: string;
  name: string;
  description: string | null;
  durationInDays: number;
  deliveryQuota: number | null;
  onQuotaExhausted: string;
  price: number;
  isActive: boolean;
}

export const toPlan = (p: BackendPlan): Plan => ({
  id: p.planId,
  name: p.name,
  description: p.description,
  durationDays: p.durationInDays,
  quota: p.deliveryQuota,
  onQuotaExhausted: (p.onQuotaExhausted as QuotaPolicy) ?? "BLOCK_NEW_ORDERS",
  price: fromCentimes(p.price),
  active: p.isActive,
});

export const toBody = (d: PlanDraft) => ({
  name: d.name.trim(),
  description: d.description?.trim() || null,
  durationInDays: d.durationDays,
  deliveryQuota: d.quota,
  onQuotaExhausted: d.onQuotaExhausted,
  price: toCentimes(d.price),
});

export class HttpPlansRepository implements PlansRepository {
  async list() {
    const rows = await http.get<BackendPlan[]>(API.subscriptionPlans.list, { includeInactive: true });
    return rows.map(toPlan);
  }
  async create(d: PlanDraft) {
    await http.post(API.subscriptionPlans.list, toBody(d));
  }
  async update(id: string, d: PlanDraft) {
    await http.patch(API.subscriptionPlans.plan(id), toBody(d));
  }
  async deactivate(id: string) {
    await http.patch(API.subscriptionPlans.deactivate(id));
  }
  async reactivate(id: string) {
    await http.patch(API.subscriptionPlans.reactivate(id));
  }
}
