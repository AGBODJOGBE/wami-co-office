import type { Metadata } from "next";
import { WalletView } from "@/features/wallet";
import { RequireAccess } from "@/shared/ui/app-shell";
import { MissingRoutes } from "@/shared/ui/missing-routes";

export const metadata: Metadata = { title: "Portefeuilles" };

export default function Page() {
  return (
    <RequireAccess module="wallet">
      <>
        <WalletView />
        <MissingRoutes area="walletAdjust" />
      </>
    </RequireAccess>
  );
}
