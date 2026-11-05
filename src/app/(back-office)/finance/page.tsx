import type { Metadata } from "next";
import { FinanceView } from "@/features/finance";
import { RequireAccess } from "@/shared/ui/app-shell";
import { MissingRoutes } from "@/shared/ui/missing-routes";

export const metadata: Metadata = { title: "Finances et versements" };

export default function Page() {
  return (
    <RequireAccess module="finance">
      <>
        <FinanceView />
        <MissingRoutes area="finance" />
      </>
    </RequireAccess>
  );
}
