import type { Metadata } from "next";
import { AffiliateView } from "@/features/affiliate";
import { RequireAccess } from "@/shared/ui/app-shell";

export const metadata: Metadata = { title: "Affiliation" };

export default function Page() {
  return (
    <RequireAccess module="affiliate">
      <AffiliateView />
    </RequireAccess>
  );
}
