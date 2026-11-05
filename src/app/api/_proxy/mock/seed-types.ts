/**
 * Types du domaine utilisés par le faux backend (imports de types uniquement :
 * aucun code des features n'est exécuté côté serveur).
 */
export type { Incident, Mission, Overview } from "@/features/live-ops";
export type { Ride } from "@/features/rides";
/** Affilié tel que stocké par le faux backend (converti au format du backend WAMI dans les handlers). */
export interface Affiliate {
  id: string;
  name: string;
  kind: "individual" | "agency";
  phone: string;
  code: string;
  activations: number;
  pending: number;
  ratePerActivation: number;
  paid: number;
  status: "active" | "suspended" | "closed";
  commissionRate?: number | null;
}
export type { Delivery } from "@/features/delivery";
export type { B2bAccount, Invoice } from "@/features/delivery-b2b";
export type { Courier, Round } from "@/features/rounds";
export type { ParcelType } from "@/features/parcel-types";
export type { ServiceCategory } from "@/features/vtc";
export type { Dossier } from "@/features/documents";
export type { Driver } from "@/features/drivers";
export type { Vehicle } from "@/features/vehicles";
/** Contrat tel que stocké par le faux backend (le contrat réseau est converti dans les handlers). */
export interface Contract {
  id: string;
  driverName: string;
  vehicleLabel: string;
  plate: string;
  startDate: string;
  totalPrice: number;
  deposit: number;
  weeklyInstallment: number;
  weeks: number;
  payments: Array<{ id: string; date: string; amount: number; method: "cash" | "momo" | "earnings" }>;
  status: "active" | "suspended" | "completed" | "terminated";
}
export type { Establishment } from "@/features/establishments";
export type { Ticket } from "@/features/support";
export type { Wallet } from "@/features/wallet";
export type { FinanceSummary, PayoutBatch } from "@/features/finance";
export type { PromoCode } from "@/features/promo-codes";
/** Parrainage tel que stocké par le faux backend (converti au format du backend WAMI dans les handlers). */
export interface Referral {
  id: string;
  referrerName: string;
  refereeName: string;
  createdAt: string;
  missionsDone: number;
  status: "pending" | "rewarded" | "flagged";
  suspicion: string | null;
}

export interface ReferralProgram {
  active: boolean;
  referrerReward: number;
  refereeReward: number;
  requiredMissions: number;
}
export type { Campaign } from "@/features/notifications";
export type { Commission, Tariff, Zone } from "@/features/pricing-zones";
export type { AuditEntry, Member } from "@/features/rbac";
export type { PlatformSettings } from "@/features/settings";
export type { SearchHit } from "@/features/search";
