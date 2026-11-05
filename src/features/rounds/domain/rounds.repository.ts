import type { Courier, Round } from "./round";

export interface RoundsRepository {
  list(): Promise<Round[]>;
  couriers(): Promise<Courier[]>;
  assign(roundId: string, courierId: string): Promise<Round>;
}
