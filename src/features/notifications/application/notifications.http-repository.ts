import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { Campaign, CampaignDraft } from "../domain/campaign";
import type { NotificationsRepository } from "../domain/notifications.repository";

export class HttpNotificationsRepository implements NotificationsRepository {
  list() {
    return http.get<Campaign[]>(API.notifications.campaigns);
  }
  create(draft: CampaignDraft) {
    return http.post<Campaign>(API.notifications.campaigns, draft);
  }
}
