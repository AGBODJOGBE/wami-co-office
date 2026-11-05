/** Rôles internes, membres de l'équipe et journal des actions. */
import type { Role } from "@/shared/auth/permissions";

export interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  lastSeenAt: string | null;
  twoFactor: boolean;
  invited: boolean;
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  category: "Argent" | "Comptes" | "Réglages" | "Opérations";
  action: string;
}

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function inviteBlocker(name: string, email: string, members: Member[]): string | null {
  if (name.trim().length < 2) return "Nom obligatoire.";
  if (!EMAIL.test(email.trim())) return "Adresse e-mail invalide.";
  if (members.some((m) => m.email.toLowerCase() === email.trim().toLowerCase())) return "Cette personne fait déjà partie de l’équipe.";
  return null;
}

/** Il doit toujours rester au moins un super admin. */
export function roleChangeBlocker(member: Member, next: Role | null, members: Member[], actingId: string): string | null {
  if (member.id === actingId) return "Vous ne pouvez pas modifier votre propre accès.";
  if (member.role === "superAdmin" && next !== "superAdmin") {
    const admins = members.filter((m) => m.role === "superAdmin").length;
    if (admins <= 1) return "Il doit rester au moins un super admin.";
  }
  return null;
}
