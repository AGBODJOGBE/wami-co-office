import type { Metadata } from "next";
import { GrantsView } from "@/features/wallet-grants";
import { RequireAccess } from "@/shared/ui/app-shell";

export const metadata: Metadata = { title: "Dotations" };

export default function Page() {
  return (
    <RequireAccess module="wallet-grants">
      <GrantsView />
    </RequireAccess>
  );
}
