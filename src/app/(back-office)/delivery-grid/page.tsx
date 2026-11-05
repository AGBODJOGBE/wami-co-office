import type { Metadata } from "next";
import { GridView } from "@/features/delivery-grid";
import { RequireAccess } from "@/shared/ui/app-shell";

export const metadata: Metadata = { title: "Grille des livraisons" };

export default function Page() {
  return (
    <RequireAccess module="delivery-grid">
      <GridView />
    </RequireAccess>
  );
}
