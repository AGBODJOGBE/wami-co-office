import type { Metadata } from "next";
import { VtcView } from "@/features/vtc";
import { RequireAccess } from "@/shared/ui/app-shell";
import { MissingRoutes } from "@/shared/ui/missing-routes";

export const metadata: Metadata = { title: "Offres VTC" };

export default function Page() {
  return (
    <RequireAccess module="vtc">
      <>
        <VtcView />
        <MissingRoutes area="vtc" />
      </>
    </RequireAccess>
  );
}
