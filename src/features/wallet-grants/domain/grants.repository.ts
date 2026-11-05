import type { Grant, GrantDraft, GrantPreview, GrantStatus } from "./grant";

export interface GrantsRepository {
  list(status: GrantStatus | "all"): Promise<Grant[]>;
  preview(d: GrantDraft): Promise<GrantPreview>;
  create(d: GrantDraft): Promise<void>;
  approve(id: string): Promise<void>;
  reject(id: string, reason: string): Promise<void>;
  cancel(id: string): Promise<void>;
  retry(id: string): Promise<void>;
}
