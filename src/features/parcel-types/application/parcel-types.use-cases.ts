import { fail, guard, type Result } from "@/shared/lib/result";
import { parcelTypeBlocker, type ParcelType } from "../domain/parcel-type";
import type { ParcelTypesRepository } from "../domain/parcel-types.repository";
import { HttpParcelTypesRepository } from "./parcel-types.http-repository";

export function createParcelTypesUseCases(repo: ParcelTypesRepository) {
  return {
    list: () => guard(() => repo.list()),
    save: (t: ParcelType, all: ParcelType[], isNew: boolean): Promise<Result<ParcelType>> => {
      const blocker = parcelTypeBlocker(t, all, isNew);
      if (blocker) return Promise.resolve(fail("validation", blocker));
      return guard(() => (isNew ? repo.create(t) : repo.update(t)));
    },
  };
}

export const parcelTypesUseCases = createParcelTypesUseCases(new HttpParcelTypesRepository());
