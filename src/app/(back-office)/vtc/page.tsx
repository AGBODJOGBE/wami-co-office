import type { Metadata } from "next";
import { VtcView } from "@/features/vtc";
import { RequireAccess } from "@/shared/ui/app-shell";

export const metadata: Metadata = { title: "Offres VTC" };

export default function Page() {
  return (
    <RequireAccess module="vtc">
      <VtcView />
    </RequireAccess>
  );
}
