import type { Metadata } from "next";
import { PromoCodesView } from "@/features/promo-codes";
import { RequireAccess } from "@/shared/ui/app-shell";

export const metadata: Metadata = { title: "Codes promo" };

export default function Page() {
  return (
    <RequireAccess module="promo-codes">
      <PromoCodesView />
    </RequireAccess>
  );
}
