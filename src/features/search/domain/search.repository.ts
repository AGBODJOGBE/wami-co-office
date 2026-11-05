import type { SearchHit } from "./search";

export interface SearchRepository {
  search(q: string): Promise<SearchHit[]>;
}
