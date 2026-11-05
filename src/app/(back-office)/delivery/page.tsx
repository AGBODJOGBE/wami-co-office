import type { Metadata } from "next";
import { DeliveryView } from "@/features/delivery";
import { RequireAccess } from "@/shared/ui/app-shell";
import { MissingRoutes } from "@/shared/ui/missing-routes";

export const metadata: Metadata = { title: "Livraisons" };

export default function Page() {
  return (
    <RequireAccess module="delivery">
      <>
        <DeliveryView />
        <MissingRoutes area="delivery" />
      </>
    </RequireAccess>
  );
}
