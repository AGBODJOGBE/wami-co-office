import type { Metadata } from "next";
import { ReferralsView } from "@/features/referrals";
import { RequireAccess } from "@/shared/ui/app-shell";
import { MissingRoutes } from "@/shared/ui/missing-routes";

export const metadata: Metadata = { title: "Parrainage" };

export default function Page() {
  return (
    <RequireAccess module="referrals">
      <>
        <ReferralsView />
        <MissingRoutes area="referralProgram" />
      </>
    </RequireAccess>
  );
}
