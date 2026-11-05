import type { Metadata } from "next";
import { EstablishmentsView } from "@/features/establishments";
import { RequireAccess } from "@/shared/ui/app-shell";
import { MissingRoutes } from "@/shared/ui/missing-routes";

export const metadata: Metadata = { title: "Établissements" };

export default function Page() {
  return (
    <RequireAccess module="establishments">
      <>
        <EstablishmentsView />
        <MissingRoutes area="establishments" />
      </>
    </RequireAccess>
  );
}
