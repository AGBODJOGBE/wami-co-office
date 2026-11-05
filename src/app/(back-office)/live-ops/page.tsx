import type { Metadata } from "next";
import { LiveOpsView } from "@/features/live-ops";
import { RequireAccess } from "@/shared/ui/app-shell";
import { MissingRoutes } from "@/shared/ui/missing-routes";

export const metadata: Metadata = { title: "Opérations en direct" };

export default function Page() {
  return (
    <RequireAccess module="live-ops">
      <>
        <LiveOpsView />
        <MissingRoutes area="liveOps" />
      </>
    </RequireAccess>
  );
}
