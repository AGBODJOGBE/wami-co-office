import type { Plan, PlanDraft } from "./plan";

export interface PlansRepository {
  list(): Promise<Plan[]>;
  create(d: PlanDraft): Promise<void>;
  update(id: string, d: PlanDraft): Promise<void>;
  deactivate(id: string): Promise<void>;
  reactivate(id: string): Promise<void>;
}
