import type { Module } from "@/shared/auth/permissions";

export interface NavItem {
  module: Module;
  href: string;
  label: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Menu latéral. Chaque entrée n'apparaît que si le rôle a accès au module. */
export const NAVIGATION: NavGroup[] = [
  { label: "Pilotage", items: [{ module: "dashboard", href: "/", label: "Tableau de bord" }] },
  {
    label: "Opérations",
    items: [
      { module: "live-ops", href: "/live-ops", label: "En direct et incidents" },
      { module: "rides", href: "/rides", label: "Courses" },
      { module: "scheduled-rides", href: "/scheduled-rides", label: "Courses programmées" },
      { module: "delivery", href: "/delivery", label: "Livraisons" },
      { module: "delivery-b2c", href: "/delivery-b2c", label: "Livraisons B2C" },
      { module: "rounds", href: "/rounds", label: "Tournées" },
    ],
  },
  {
    label: "Réseau",
    items: [
      { module: "documents", href: "/documents", label: "Vérifications" },
      { module: "drivers", href: "/drivers", label: "Chauffeurs et livreurs" },
      { module: "partners", href: "/partners", label: "Partenaires à valider" },
      { module: "vehicles", href: "/vehicles", label: "Véhicules" },
      { module: "contracts", href: "/contracts", label: "Contrats location-vente" },
      { module: "driver-bonus", href: "/driver-bonus", label: "Primes chauffeurs" },
      { module: "establishments", href: "/establishments", label: "Établissements" },
    ],
  },
  {
    label: "Clients",
    items: [
      { module: "users", href: "/users", label: "Utilisateurs" },
      { module: "support", href: "/support", label: "Support et litiges" },
      { module: "delivery-b2b", href: "/delivery-b2b", label: "Comptes entreprises" },
      { module: "referrals", href: "/referrals", label: "Parrainage" },
      { module: "notifications", href: "/notifications", label: "Notifications" },
    ],
  },
  {
    label: "Argent",
    items: [
      { module: "finance", href: "/finance", label: "Finances et versements" },
      { module: "wallet", href: "/wallet", label: "Portefeuilles" },
      { module: "withdrawals", href: "/withdrawals", label: "Retraits" },
      { module: "payments", href: "/payments", label: "Paiements Mobile Money" },
      { module: "wallet-grants", href: "/wallet-grants", label: "Dotations" },
      { module: "receivables", href: "/receivables", label: "Revenus et créances" },
      { module: "affiliate", href: "/affiliate", label: "Affiliation" },
      { module: "promo-codes", href: "/promo-codes", label: "Codes promo" },
      { module: "subscription-plans", href: "/subscription-plans", label: "Plans d’abonnement" },
    ],
  },
  {
    label: "Réglages",
    items: [
      { module: "pricing-zones", href: "/pricing-zones", label: "Tarifs et zones" },
      { module: "pricing-profiles", href: "/pricing-profiles", label: "Profils tarifaires" },
      { module: "delivery-grid", href: "/delivery-grid", label: "Grille des livraisons" },
      { module: "wallet-config", href: "/wallet-config", label: "Règles des portefeuilles" },
      { module: "vtc", href: "/vtc", label: "Offres VTC" },
      { module: "parcel-types", href: "/parcel-types", label: "Types de colis" },
      { module: "rbac", href: "/rbac", label: "Rôles et journal" },
      { module: "system-config", href: "/system-config", label: "Configuration système" },
      { module: "settings", href: "/settings", label: "Paramètres" },
    ],
  },
];
