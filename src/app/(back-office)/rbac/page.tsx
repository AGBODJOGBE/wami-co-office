import type { Metadata } from "next";
import { RbacView } from "@/features/rbac";
import { RequireAccess } from "@/shared/ui/app-shell";

export const metadata: Metadata = { title: "Rôles et journal" };

export default function Page() {
  return (
    <RequireAccess module="rbac">
      <RbacView />
    </RequireAccess>
  );
}
