import type { Metadata } from "next";
import { NotificationsView } from "@/features/notifications";
import { RequireAccess } from "@/shared/ui/app-shell";
import { MissingRoutes } from "@/shared/ui/missing-routes";

export const metadata: Metadata = { title: "Notifications" };

export default function Page() {
  return (
    <RequireAccess module="notifications">
      <>
        <NotificationsView />
        <MissingRoutes area="notifications" />
      </>
    </RequireAccess>
  );
}
