import type { Metadata } from "next";
import { DriverBonusView } from "@/features/driver-bonus";
import { RequireAccess } from "@/shared/ui/app-shell";
import { MissingRoutes } from "@/shared/ui/missing-routes";

export const metadata: Metadata = { title: "Primes chauffeurs" };

export default function Page() {
  return (
    <RequireAccess module="driver-bonus">
      <>
        <DriverBonusView />
        <MissingRoutes area="driverChallenges" />
      </>
    </RequireAccess>
  );
}
