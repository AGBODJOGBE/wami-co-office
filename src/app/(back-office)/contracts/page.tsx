import type { Metadata } from "next";
import { ContractsView } from "@/features/contracts";
import { RequireAccess } from "@/shared/ui/app-shell";

export const metadata: Metadata = { title: "Contrats location-vente" };

export default function Page() {
  return (
    <RequireAccess module="contracts">
      <ContractsView />
    </RequireAccess>
  );
}
