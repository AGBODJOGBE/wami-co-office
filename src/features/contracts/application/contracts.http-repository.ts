import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { ContractsRepository } from "../domain/contracts.repository";
import type { LeaseContract, LeaseFrequency, LeaseInstallment, LeaseStatus, PaymentMethod } from "../domain/lease-contract";

/** Contrat renvoyé par `GET /api/admin/contracts` (backend wami-co). */
export interface BackendContract {
  id: string;
  driverId: string;
  dateDebut: string;
  dateFinPrevue: string;
  frequenceEcheances: "JOURNALIER" | "HEBDOMADAIRE" | "MENSUEL";
  nbEcheances: number;
  montantTotal: number;
  downPayment: number;
  montantEcheance: number;
  montantPaye: number;
  montantRestant: number;
  statut: "ACTIF" | "SUSPENDU" | "TERMINE" | "ROMPU";
  nbImpayes: number;
  modeRemboursement: "ECHEANCIER" | "PAR_REVENU";
  vehicle: { licensePlate: string; make: string; model: string } | null;
}

export interface BackendInstallment {
  id: string;
  numero: number;
  dateEcheance: string;
  montant: number;
  montantPaye: number;
  statut: string;
}

const FREQUENCY: Record<BackendContract["frequenceEcheances"], LeaseFrequency> = { JOURNALIER: "daily", HEBDOMADAIRE: "weekly", MENSUEL: "monthly" };
const STATUS: Record<BackendContract["statut"], LeaseStatus> = { ACTIF: "active", SUSPENDU: "suspended", TERMINE: "completed", ROMPU: "broken" };
const INSTALLMENT: Record<string, LeaseInstallment["status"]> = {
  EN_ATTENTE: "pending",
  PAYEE: "paid",
  IMPAYEE: "unpaid",
  PARTIELLEMENT_RECOUVREE: "partial",
  EN_RECOUVREMENT: "recovering",
  ANNULEE: "cancelled",
};

export function toContract(c: BackendContract, driverNames: Map<string, string>): LeaseContract {
  return {
    id: c.id,
    driverId: c.driverId,
    driverName: driverNames.get(c.driverId) ?? "Chauffeur inconnu",
    vehicleLabel: c.vehicle ? `${c.vehicle.make} ${c.vehicle.model}`.trim() : "—",
    plate: c.vehicle?.licensePlate ?? "—",
    startDate: c.dateDebut,
    endDate: c.dateFinPrevue,
    frequency: FREQUENCY[c.frequenceEcheances],
    installmentCount: c.nbEcheances,
    installmentAmount: c.montantEcheance,
    totalAmount: c.montantTotal,
    downPayment: c.downPayment,
    paid: c.montantPaye,
    remaining: c.montantRestant,
    unpaidCount: c.nbImpayes,
    status: STATUS[c.statut],
    repaymentMode: c.modeRemboursement === "PAR_REVENU" ? "revenueShare" : "schedule",
  };
}

export function toInstallment(i: BackendInstallment): LeaseInstallment {
  return { id: i.id, number: i.numero, dueDate: i.dateEcheance, amount: i.montant, paid: i.montantPaye, status: INSTALLMENT[i.statut] ?? "pending" };
}

export class HttpContractsRepository implements ContractsRepository {
  async list() {
    // Le contrat ne porte que l'identifiant du chauffeur : on récupère les noms via la liste des chauffeurs.
    const [{ items }, { drivers }] = await Promise.all([
      http.get<{ items: BackendContract[] }>(API.contracts.list, { limit: 100 }),
      http.get<{ drivers: Array<{ driverId: string; firstName: string; lastName: string }> }>(API.drivers.list),
    ]);
    const names = new Map(drivers.map((d) => [d.driverId, `${d.firstName} ${d.lastName}`.trim()]));
    return items.map((c) => toContract(c, names));
  }
  async installments(contractId: string) {
    const { items } = await http.get<{ items: BackendInstallment[] }>(API.contracts.installments(contractId));
    return items.map(toInstallment);
  }
  async recordPayment(contractId: string, amount: number, method: PaymentMethod, reference: string) {
    await http.post(API.contracts.manualPayment(contractId), { amount, paymentMethod: method === "cash" ? "ESPECES" : "MOBILE_MONEY", reference });
  }
  async suspend(contractId: string, reason: string) {
    await http.post(API.contracts.suspend(contractId), { reason });
  }
  async resume(contractId: string) {
    await http.post(API.contracts.resume(contractId));
  }
  async breakContract(contractId: string, reason: string) {
    await http.post(API.contracts.break(contractId), { reason });
  }
}
