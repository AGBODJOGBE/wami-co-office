import { fail, guard, type Result } from "@/shared/lib/result";
import { draftBlocker, type Campaign, type CampaignDraft } from "../domain/campaign";
import type { NotificationsRepository } from "../domain/notifications.repository";
import { HttpNotificationsRepository } from "./notifications.http-repository";

export function createNotificationsUseCases(repo: NotificationsRepository, clock: () => Date = () => new Date()) {
  return {
    list: () => guard(() => repo.list()),
    send: (d: CampaignDraft): Promise<Result<Campaign>> => {
      const blocker = draftBlocker(d, clock());
      if (blocker) return Promise.resolve(fail("validation", blocker));
      return guard(() => repo.create({ ...d, title: d.title.trim(), body: d.body.trim() }));
    },
  };
}

export const notificationsUseCases = createNotificationsUseCases(new HttpNotificationsRepository());
