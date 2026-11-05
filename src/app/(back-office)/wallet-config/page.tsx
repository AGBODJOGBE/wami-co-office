import type { Metadata } from "next";
import { WalletConfigView } from "@/features/wallet-config";
import { RequireAccess } from "@/shared/ui/app-shell";

export const metadata: Metadata = { title: "Règles des portefeuilles" };

export default function Page() {
  return (
    <RequireAccess module="wallet-config">
      <WalletConfigView />
    </RequireAccess>
  );
}
