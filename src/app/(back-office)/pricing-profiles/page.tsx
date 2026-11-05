import type { Metadata } from "next";
import { PricingProfilesView } from "@/features/pricing-profiles";
import { RequireAccess } from "@/shared/ui/app-shell";

export const metadata: Metadata = { title: "Profils tarifaires" };

export default function Page() {
  return (
    <RequireAccess module="pricing-profiles">
      <PricingProfilesView />
    </RequireAccess>
  );
}
