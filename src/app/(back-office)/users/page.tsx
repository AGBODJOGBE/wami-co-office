import type { Metadata } from "next";
import { UsersView } from "@/features/users";
import { RequireAccess } from "@/shared/ui/app-shell";

export const metadata: Metadata = { title: "Utilisateurs" };

export default function Page() {
  return (
    <RequireAccess module="users">
      <UsersView />
    </RequireAccess>
  );
}
