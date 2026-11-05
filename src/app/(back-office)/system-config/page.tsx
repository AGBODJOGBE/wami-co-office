import type { Metadata } from "next";
import { SystemConfigView } from "@/features/system-config";
import { RequireAccess } from "@/shared/ui/app-shell";

export const metadata: Metadata = { title: "Configuration système" };

export default function Page() {
  return (
    <RequireAccess module="system-config">
      <SystemConfigView />
    </RequireAccess>
  );
}
