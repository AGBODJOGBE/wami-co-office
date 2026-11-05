import type { Metadata } from "next";
import { FinanceView } from "@/features/finance";
import { RequireAccess } from "@/shared/ui/app-shell";

export const metadata: Metadata = { title: "Finances et versements" };

export default function Page() {
  return (
    <RequireAccess module="finance">
      <FinanceView />
    </RequireAccess>
  );
}
