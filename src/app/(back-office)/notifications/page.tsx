import type { Metadata } from "next";
import { NotificationsView } from "@/features/notifications";
import { RequireAccess } from "@/shared/ui/app-shell";

export const metadata: Metadata = { title: "Notifications" };

export default function Page() {
  return (
    <RequireAccess module="notifications">
      <NotificationsView />
    </RequireAccess>
  );
}
