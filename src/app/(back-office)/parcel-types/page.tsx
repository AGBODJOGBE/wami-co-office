import type { Metadata } from "next";
import { ParcelTypesView } from "@/features/parcel-types";
import { RequireAccess } from "@/shared/ui/app-shell";
import { MissingRoutes } from "@/shared/ui/missing-routes";

export const metadata: Metadata = { title: "Types de colis" };

export default function Page() {
  return (
    <RequireAccess module="parcel-types">
      <>
        <ParcelTypesView />
        <MissingRoutes area="parcelTypes" />
      </>
    </RequireAccess>
  );
}
