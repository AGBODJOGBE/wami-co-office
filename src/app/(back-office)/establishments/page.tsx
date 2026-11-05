import type { Metadata } from "next";
import { EstablishmentsView } from "@/features/establishments";
import { RequireAccess } from "@/shared/ui/app-shell";

export const metadata: Metadata = { title: "Établissements" };

export default function Page() {
  return (
    <RequireAccess module="establishments">
      <EstablishmentsView />
    </RequireAccess>
  );
}
