import type { Metadata } from "next";
import { RoundsView } from "@/features/rounds";
import { RequireAccess } from "@/shared/ui/app-shell";
import { MissingRoutes } from "@/shared/ui/missing-routes";

export const metadata: Metadata = { title: "Tournées" };

export default function Page() {
  return (
    <RequireAccess module="rounds">
      <>
        <RoundsView />
        <MissingRoutes area="rounds" />
      </>
    </RequireAccess>
  );
}
