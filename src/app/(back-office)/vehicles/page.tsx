import type { Metadata } from "next";
import { VehiclesView } from "@/features/vehicles";
import { RequireAccess } from "@/shared/ui/app-shell";
import { MissingRoutes } from "@/shared/ui/missing-routes";

export const metadata: Metadata = { title: "Véhicules" };

export default function Page() {
  return (
    <RequireAccess module="vehicles">
      <>
        <VehiclesView />
        <MissingRoutes area="vehicles" />
      </>
    </RequireAccess>
  );
}
