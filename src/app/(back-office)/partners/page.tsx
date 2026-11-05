import type { Metadata } from "next";
import { PartnersView } from "@/features/partners";
import { RequireAccess } from "@/shared/ui/app-shell";

export const metadata: Metadata = { title: "Partenaires à valider" };

export default function Page() {
  return (
    <RequireAccess module="partners">
      <PartnersView />
    </RequireAccess>
  );
}
