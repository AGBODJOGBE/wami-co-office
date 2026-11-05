import type { Metadata } from "next";
import { PricingView } from "@/features/pricing-zones";
import { RequireAccess } from "@/shared/ui/app-shell";
import { MissingRoutes } from "@/shared/ui/missing-routes";

export const metadata: Metadata = { title: "Tarifs et zones" };

export default function Page() {
  return (
    <RequireAccess module="pricing-zones">
      <>
        <PricingView />
        <MissingRoutes area="pricingZones" />
      </>
    </RequireAccess>
  );
}
