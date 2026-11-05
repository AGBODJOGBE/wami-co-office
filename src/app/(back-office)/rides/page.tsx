import type { Metadata } from "next";
import { RidesView } from "@/features/rides";
import { RequireAccess } from "@/shared/ui/app-shell";

export const metadata: Metadata = { title: "Courses" };

export default function Page() {
  return (
    <RequireAccess module="rides">
      <RidesView />
    </RequireAccess>
  );
}
