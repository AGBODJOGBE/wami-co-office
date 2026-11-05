import type { Metadata } from "next";
import { DocumentsView } from "@/features/documents";
import { RequireAccess } from "@/shared/ui/app-shell";
import { MissingRoutes } from "@/shared/ui/missing-routes";

export const metadata: Metadata = { title: "Vérifications" };

export default function Page() {
  return (
    <RequireAccess module="documents">
      <>
        <DocumentsView />
        <MissingRoutes area="documents" />
      </>
    </RequireAccess>
  );
}
