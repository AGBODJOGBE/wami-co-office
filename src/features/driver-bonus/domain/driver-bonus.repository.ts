import type { Challenge, ChallengeDraft } from "./challenge";

export interface DriverBonusRepository {
  list(): Promise<Challenge[]>;
  create(draft: ChallengeDraft): Promise<Challenge>;
  archive(id: string): Promise<Challenge>;
}
