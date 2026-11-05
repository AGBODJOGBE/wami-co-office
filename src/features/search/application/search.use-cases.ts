import { guard, ok, type Result } from "@/shared/lib/result";
import { MIN_QUERY, normalizeQuery, type SearchHit } from "../domain/search";
import type { SearchRepository } from "../domain/search.repository";
import { HttpSearchRepository } from "./search.http-repository";

export function createSearchUseCases(repo: SearchRepository) {
  return {
    search: (raw: string): Promise<Result<SearchHit[]>> => {
      const q = normalizeQuery(raw);
      if (q.length < MIN_QUERY) return Promise.resolve(ok([]));
      return guard(() => repo.search(q));
    },
  };
}

export const searchUseCases = createSearchUseCases(new HttpSearchRepository());
