import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { ParcelType } from "../domain/parcel-type";
import type { ParcelTypesRepository } from "../domain/parcel-types.repository";

export class HttpParcelTypesRepository implements ParcelTypesRepository {
  list() {
    return http.get<ParcelType[]>(API.parcelTypes.list);
  }
  create(t: ParcelType) {
    return http.post<ParcelType>(API.parcelTypes.list, t);
  }
  update(t: ParcelType) {
    return http.put<ParcelType>(API.parcelTypes.item(t.code), t);
  }
}
