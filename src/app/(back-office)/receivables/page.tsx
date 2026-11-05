import type { Metadata } from "next";
import { ReceivablesView } from "@/features/receivables";
import { RequireAccess } from "@/shared/ui/app-shell";

export const metadata: Metadata = { title: "Revenus et créances" };

export default function Page() {
  return (
    <RequireAccess module="receivables">
      <ReceivablesView />
    </RequireAccess>
  );
}
