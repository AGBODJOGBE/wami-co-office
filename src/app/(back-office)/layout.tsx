import type { ReactNode } from "react";
import { AppShell } from "@/shared/ui/app-shell";

/** Toutes les pages du back-office partagent le menu, la recherche et les messages. */
export default function BackOfficeLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
