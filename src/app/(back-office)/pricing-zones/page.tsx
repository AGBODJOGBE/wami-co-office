import type { Metadata } from "next";
import { PricingView } from "@/features/pricing-zones";
import { RequireAccess } from "@/shared/ui/app-shell";

export const metadata: Metadata = { title: "Tarifs et zones" };

export default function Page() {
  return (
    <RequireAccess module="pricing-zones">
      <PricingView />
    </RequireAccess>
  );
}
