import type { Campaign, CampaignDraft } from "./campaign";

export interface NotificationsRepository {
  list(): Promise<Campaign[]>;
  create(draft: CampaignDraft): Promise<Campaign>;
}
