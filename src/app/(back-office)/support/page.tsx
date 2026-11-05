import type { Metadata } from "next";
import { SupportView } from "@/features/support";
import { RequireAccess } from "@/shared/ui/app-shell";

export const metadata: Metadata = { title: "Support et litiges" };

export default function Page() {
  return (
    <RequireAccess module="support">
      <SupportView />
    </RequireAccess>
  );
}
