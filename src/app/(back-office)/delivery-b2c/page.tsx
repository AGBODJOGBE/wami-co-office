import type { Metadata } from "next";
import { B2cDeliveriesView } from "@/features/delivery-b2c";
import { RequireAccess } from "@/shared/ui/app-shell";

export const metadata: Metadata = { title: "Livraisons B2C" };

export default function Page() {
  return (
    <RequireAccess module="delivery-b2c">
      <B2cDeliveriesView />
    </RequireAccess>
  );
}
