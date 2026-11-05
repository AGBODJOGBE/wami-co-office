import type { Metadata } from "next";
import { B2bView } from "@/features/delivery-b2b";
import { RequireAccess } from "@/shared/ui/app-shell";
import { MissingRoutes } from "@/shared/ui/missing-routes";

export const metadata: Metadata = { title: "Comptes entreprises" };

export default function Page() {
  return (
    <RequireAccess module="delivery-b2b">
      <>
        <B2bView />
        <MissingRoutes area="deliveryB2b" />
      </>
    </RequireAccess>
  );
}
