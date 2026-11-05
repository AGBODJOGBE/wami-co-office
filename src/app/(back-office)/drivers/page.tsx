import type { Metadata } from "next";
import { DriversView } from "@/features/drivers";
import { RequireAccess } from "@/shared/ui/app-shell";

export const metadata: Metadata = { title: "Chauffeurs et livreurs" };

export default function Page() {
  return (
    <RequireAccess module="drivers">
      <DriversView />
    </RequireAccess>
  );
}
