import type { Metadata } from "next";
import { WithdrawalsView } from "@/features/withdrawals";
import { RequireAccess } from "@/shared/ui/app-shell";

export const metadata: Metadata = { title: "Retraits" };

export default function Page() {
  return (
    <RequireAccess module="withdrawals">
      <WithdrawalsView />
    </RequireAccess>
  );
}
