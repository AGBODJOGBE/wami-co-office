import type { Metadata } from "next";
import { PlansView } from "@/features/subscription-plans";
import { RequireAccess } from "@/shared/ui/app-shell";

export const metadata: Metadata = { title: "Plans d’abonnement" };

export default function Page() {
  return (
    <RequireAccess module="subscription-plans">
      <PlansView />
    </RequireAccess>
  );
}
