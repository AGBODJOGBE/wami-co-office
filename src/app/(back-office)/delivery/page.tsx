import type { Metadata } from "next";
import { DeliveryView } from "@/features/delivery";
import { RequireAccess } from "@/shared/ui/app-shell";

export const metadata: Metadata = { title: "Livraisons" };

export default function Page() {
  return (
    <RequireAccess module="delivery">
      <DeliveryView />
    </RequireAccess>
  );
}
