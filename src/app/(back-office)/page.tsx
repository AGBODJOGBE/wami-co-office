import type { Metadata } from "next";
import { DashboardView } from "@/features/live-ops";
import { RequireAccess } from "@/shared/ui/app-shell";
import { MissingRoutes } from "@/shared/ui/missing-routes";

export const metadata: Metadata = { title: "Tableau de bord" };

export default function Page() {
  return (
    <RequireAccess module="dashboard">
      <>
        <DashboardView />
        <MissingRoutes area="dashboard" />
      </>
    </RequireAccess>
  );
}
