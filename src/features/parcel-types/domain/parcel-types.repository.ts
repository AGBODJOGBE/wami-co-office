import type { ParcelType } from "./parcel-type";

export interface ParcelTypesRepository {
  list(): Promise<ParcelType[]>;
  create(t: ParcelType): Promise<ParcelType>;
  update(t: ParcelType): Promise<ParcelType>;
}
