import type { Metadata } from "next";
import { SettingsView } from "@/features/settings";
import { RequireAccess } from "@/shared/ui/app-shell";

export const metadata: Metadata = { title: "Paramètres" };

export default function Page() {
  return (
    <RequireAccess module="settings">
      <SettingsView />
    </RequireAccess>
  );
}
