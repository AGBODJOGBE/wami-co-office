import type { Metadata } from "next";
import { PaymentsView } from "@/features/payments";
import { RequireAccess } from "@/shared/ui/app-shell";

export const metadata: Metadata = { title: "Paiements" };

export default function Page() {
  return (
    <RequireAccess module="payments">
      <PaymentsView />
    </RequireAccess>
  );
}
