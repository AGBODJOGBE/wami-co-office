import type { Metadata } from "next";
import { ScheduledRidesView } from "@/features/scheduled-rides";
import { RequireAccess } from "@/shared/ui/app-shell";

export const metadata: Metadata = { title: "Courses programmées" };

export default function Page() {
  return (
    <RequireAccess module="scheduled-rides">
      <ScheduledRidesView />
    </RequireAccess>
  );
}
