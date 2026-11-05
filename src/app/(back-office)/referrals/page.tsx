import type { Metadata } from "next";
import { ReferralsView } from "@/features/referrals";
import { RequireAccess } from "@/shared/ui/app-shell";

export const metadata: Metadata = { title: "Parrainage" };

export default function Page() {
  return (
    <RequireAccess module="referrals">
      <ReferralsView />
    </RequireAccess>
  );
}
