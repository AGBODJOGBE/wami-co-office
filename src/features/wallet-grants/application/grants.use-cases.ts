import { fail, guard } from "@/shared/lib/result";
import { approveBlocker, cancelBlocker, draftBlocker, rejectBlocker, retryBlocker, type Grant, type GrantDraft, type GrantStatus } from "../domain/grant";
import type { GrantsRepository } from "../domain/grants.repository";
import { HttpGrantsRepository } from "./grants.http-repository";

export function createGrantsUseCases(repo: GrantsRepository) {
  return {
    list: (status: GrantStatus | "all") => guard(() => repo.list(status)),
    preview: async (d: GrantDraft) => {
      const blocker = draftBlocker(d);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.preview(d));
    },
    create: async (d: GrantDraft) => {
      const blocker = draftBlocker(d);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.create({ ...d, label: d.label.trim() }));
    },
    approve: async (g: Grant, actingId: string) => {
      const blocker = approveBlocker(g, actingId);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.approve(g.id));
    },
    reject: async (g: Grant, reason: string, actingId: string) => {
      const blocker = rejectBlocker(g, reason, actingId);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.reject(g.id, reason.trim()));
    },
    cancel: async (g: Grant) => {
      const blocker = cancelBlocker(g);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.cancel(g.id));
    },
    retry: async (g: Grant) => {
      const blocker = retryBlocker(g);
      if (blocker) return fail("validation", blocker);
      return guard(() => repo.retry(g.id));
    },
  };
}

export const grantsUseCases = createGrantsUseCases(new HttpGrantsRepository());
