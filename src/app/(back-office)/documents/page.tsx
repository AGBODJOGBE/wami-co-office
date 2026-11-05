import type { Metadata } from "next";
import { DocumentsView } from "@/features/documents";
import { RequireAccess } from "@/shared/ui/app-shell";

export const metadata: Metadata = { title: "Vérifications" };

export default function Page() {
  return (
    <RequireAccess module="documents">
      <DocumentsView />
    </RequireAccess>
  );
}
