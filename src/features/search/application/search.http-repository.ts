import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { SearchHit } from "../domain/search";
import type { SearchRepository } from "../domain/search.repository";

export class HttpSearchRepository implements SearchRepository {
  search(q: string) {
    return http.get<SearchHit[]>(API.search.query, { q });
  }
}
