import type { Metadata } from "next";
import { AffiliateView } from "@/features/affiliate";
import { RequireAccess } from "@/shared/ui/app-shell";
import { MissingRoutes } from "@/shared/ui/missing-routes";

export const metadata: Metadata = { title: "Affiliation" };

export default function Page() {
  return (
    <RequireAccess module="affiliate">
      <>
        <AffiliateView />
        <MissingRoutes area="affiliatePay" />
      </>
    </RequireAccess>
  );
}
