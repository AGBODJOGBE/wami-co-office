import "server-only";
import { audit, db, newId } from "../db";
import { find, num, replace, requireText, str } from "../helpers";
import { invalid, route, type MockRoute } from "../router";
import type { Challenge } from "../seed-types";

const A = "/v1/admin";

/** Candidatures de démonstration (état en mémoire, comme le reste du faux backend). */
const mockPending: Array<{ driverId: string; userId: string; isDocumentsVerified: boolean; createdAt: string }> = [
  { driverId: "cand-1", userId: "u-c1", isDocumentsVerified: true, createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString() },
  { driverId: "cand-2", userId: "u-c2", isDocumentsVerified: false, createdAt: new Date(Date.now() - 86_400_000).toISOString() },
];

/** Configurations de primes de démonstration (état en mémoire, comme le reste du faux backend). */
interface MockBonus {
  id: string;
  name: string;
  description: null;
  vehicleCategory: string;
  isActive: boolean;
  tiers: Array<Record<string, unknown>>;
  minRidesPerMonth?: number;
}
const mkConfig = (id: string, name: string, tiers: Array<Record<string, unknown>>, isActive: boolean): MockBonus => ({ id, name, description: null, vehicleCategory: "MOTO", isActive, tiers });
const bonusConfigs: Record<"config" | "activity-config" | "quality-config", MockBonus[]> = {
  config: [mkConfig("bt-1", "Paliers moto", [{ ridesThreshold: 50, bonusAmount: 5000 }, { ridesThreshold: 150, bonusAmount: 15000 }], true), mkConfig("bt-2", "Paliers moto (test)", [{ ridesThreshold: 30, bonusAmount: 2000 }], false)],
  "activity-config": [mkConfig("ba-1", "Activité moto", [{ name: "Bronze", ridesThresholdPerDay: 10, bonusPct: 2 }, { name: "Argent", ridesThresholdPerDay: 15, bonusPct: 3 }], true)],
  "quality-config": [{ ...mkConfig("bq-1", "Qualité moto", [{ minRating: 4.5, bonusAmount: 5000 }, { minRating: 4.8, bonusAmount: 8000 }], true), minRidesPerMonth: 100 }],
};
const bonusRun = { welcomeBonusEnabled: true, activityBonusEnabled: true, qualityBonusEnabled: true, activityPayoutFrequency: "WEEKLY" };

/** Vérifications, chauffeurs, véhicules, location-vente, primes, établissements. */
export const networkRoutes: MockRoute[] = [
  // ── Vérifications ──
  route("GET", `${A}/verifications`, "documents", ({ query }) => {
    const kind = query.get("kind");
    return db().dossiers.filter((d) => !kind || d.kind === kind);
  }),
  route("POST", `${A}/verifications/:dossierId/documents/:docId`, "documents", ({ params, body, user }) => {
    const d = find(db().dossiers, (x) => x.id === params.dossierId);
    const doc = find(d.documents, (x) => x.id === params.docId);
    if (doc.status !== "pending") throw invalid("Pièce déjà traitée.");
    const approve = body.decision === "approve";
    const reason = str(body, "reason") || null;
    if (!approve && !reason) throw invalid("Motif de refus obligatoire.");
    audit(user, "Comptes", `${approve ? "A validé" : "A refusé"} « ${doc.type} » · ${d.partnerName}${reason ? ` · motif : ${reason}` : ""}`);
    return replace(db().dossiers, (x) => x.id === d.id, {
      ...d,
      documents: d.documents.map((x) => (x.id === doc.id ? { ...x, status: approve ? "approved" : "rejected", rejectReason: reason } : x)),
    });
  }),
  route("POST", `${A}/verifications/:dossierId/activate`, "documents", ({ params, user }) => {
    const d = find(db().dossiers, (x) => x.id === params.dossierId);
    if (d.documents.some((x) => x.status !== "approved")) throw invalid("Toutes les pièces doivent être validées.");
    audit(user, "Comptes", `A activé le compte de ${d.partnerName}`);
    return replace(db().dossiers, (x) => x.id === d.id, { ...d, activated: true });
  }),

  // ── Chauffeurs et livreurs ──
  // Même contrat que le backend WAMI (GET /api/admin/drivers, PATCH …/suspend et …/reactivate).
  route("GET", `${A}/drivers`, "drivers", ({ query }) => {
    const d = db();
    const status = query.get("status");
    const drivers = d.drivers.map((x) => {
      const v = d.vehicles.find((veh) => veh.driverId === x.id);
      const [firstName = "", ...rest] = x.name.split(" ");
      return {
        driverId: x.id,
        firstName,
        lastName: rest.join(" "),
        phoneNumber: x.phone,
        status: x.status !== "active" ? "SUSPENDED" : x.online ? "AVAILABLE" : "OFFLINE",
        driverType: x.activities.length === 2 ? "BOTH" : x.activities[0] === "courier" ? "DELIVERY" : "VTC",
        rating: x.rating,
        totalRides: x.missionsTotal,
        vehicle: v ? { make: v.kind, model: v.model, color: "", licensePlate: v.plate } : null,
        createdAt: x.joinedAt,
      };
    });
    const filtered = status ? drivers.filter((x) => x.status === status) : drivers;
    return { drivers: filtered, total: filtered.length };
  }),
  // Candidatures, chauffeurs en ligne, type d'activité, sessions (contrat du backend WAMI).
  route("GET", `${A}/drivers/pending`, "drivers", () => ({ drivers: mockPending, total: mockPending.length })),
  route("PATCH", `${A}/drivers/:id/approve`, "drivers", ({ params, user }) => {
    const i = mockPending.findIndex((p) => p.driverId === params.id);
    if (i < 0) throw invalid("Driver not found");
    mockPending.splice(i, 1);
    audit(user, "Comptes", `A approuvé la candidature ${params.id}`);
    return { driverId: params.id, status: "OFFLINE", message: "Driver has been approved" };
  }),
  route("GET", `${A}/drivers/online`, "drivers", () => {
    const drivers = db().drivers.filter((d) => d.online && d.status === "active").map((d, i) => {
      const [firstName = "", ...rest] = d.name.split(" ");
      return { driverId: d.id, firstName, lastName: rest.join(" "), phoneNumber: d.phone, photoUrl: null, rating: d.rating, totalRides: d.missionsTotal, latitude: 6.37 + i * 0.01, longitude: 2.39 + i * 0.01, heading: null, speed: null, vehicle: { vehicleId: `v-${d.id}`, vehicleType: "MOTO", make: d.vehicle, model: "", color: "", licensePlate: "" }, currentRideId: null, isInRide: i % 2 === 1, updatedAt: new Date().toISOString() };
    });
    return { drivers, total: drivers.length };
  }),
  route("PATCH", `${A}/drivers/:id/info`, "drivers", ({ params, body, user }) => {
    const d = find(db().drivers, (x) => x.id === params.id);
    const [first = "", ...rest] = d.name.split(" ");
    const firstName = str(body, "firstName") || first;
    const lastName = str(body, "lastName") || rest.join(" ");
    const phone = str(body, "phoneNumber") || d.phone;
    audit(user, "Comptes", `A modifié les informations de ${d.name}`);
    replace(db().drivers, (x) => x.id === d.id, { ...d, name: `${firstName} ${lastName}`.trim(), phone });
    return { driverId: d.id, userId: d.id, firstName, lastName, phoneNumber: phone, isPhoneVerified: !str(body, "phoneNumber"), isEmailVerified: false, message: "Driver info updated" };
  }),
  route("PATCH", `${A}/drivers/:id/driver-type`, "drivers", ({ params, body, user }) => {
    const d = find(db().drivers, (x) => x.id === params.id);
    const t = str(body, "driverType");
    if (!["VTC", "DELIVERY", "BOTH"].includes(t)) throw invalid("driverType must be one of: VTC, DELIVERY, BOTH");
    audit(user, "Comptes", `Type d’activité de ${d.name} : ${t}`);
    replace(db().drivers, (x) => x.id === d.id, { ...d, activities: t === "BOTH" ? ["driver", "courier"] : t === "DELIVERY" ? ["courier"] : ["driver"] });
    return { driverId: d.id, driverType: t, message: `Driver type updated to ${t}.` };
  }),
  route("GET", `${A}/drivers/:id/sessions`, "drivers", ({ params }) => ({
    sessions: [
      { id: `${params.id}-s1`, driverId: params.id, startedAt: new Date(Date.now() - 7_200_000).toISOString(), endedAt: null, durationSeconds: null, endReason: null },
      { id: `${params.id}-s2`, driverId: params.id, startedAt: new Date(Date.now() - 90_000_000).toISOString(), endedAt: new Date(Date.now() - 80_000_000).toISOString(), durationSeconds: 10_000, endReason: "LOGOUT" },
    ],
    total: 2, totalDurationSeconds: 10_000, page: 1, limit: 20,
  })),
  route("PATCH", `${A}/drivers/:id/suspend`, "drivers", ({ params, body, user }) => {
    const d = find(db().drivers, (x) => x.id === params.id);
    const reason = str(body, "reason");
    requireText(reason, 1, "reason is required");
    audit(user, "Comptes", `A suspendu ${d.name} · ${reason}`);
    replace(db().drivers, (x) => x.id === d.id, { ...d, status: "suspended", online: false, suspensionReason: reason });
    return { driverId: d.id, status: "SUSPENDED", message: `Driver suspended: ${reason}` };
  }),
  route("PATCH", `${A}/drivers/:id/reactivate`, "drivers", ({ params, user }) => {
    const d = find(db().drivers, (x) => x.id === params.id);
    audit(user, "Comptes", `A réactivé ${d.name}`);
    replace(db().drivers, (x) => x.id === d.id, { ...d, status: "active", online: false, suspensionReason: null });
    return { driverId: d.id, status: "OFFLINE", message: "Driver reactivated successfully" };
  }),

  // ── Véhicules ──
  route("GET", `${A}/vehicles`, "vehicles", () => db().vehicles),
  route("POST", `${A}/vehicles/:id/assign`, "vehicles", ({ params, body, user }) => {
    const v = find(db().vehicles, (x) => x.id === params.id);
    const driverId = typeof body.driverId === "string" ? body.driverId : null;
    if (driverId === null) {
      audit(user, "Opérations", `A retiré ${v.plate} à ${v.driverName ?? "—"}`);
      return replace(db().vehicles, (x) => x.id === v.id, { ...v, driverId: null, driverName: null, status: "available" });
    }
    const d = find(db().drivers, (x) => x.id === driverId, "Conducteur introuvable.");
    if (db().vehicles.some((x) => x.driverId === d.id)) throw invalid(`${d.name} a déjà un véhicule.`);
    audit(user, "Opérations", `A affecté ${v.plate} à ${d.name}`);
    return replace(db().vehicles, (x) => x.id === v.id, { ...v, driverId: d.id, driverName: d.name, status: "inService" });
  }),

  // ── Location-vente ── (contrat du backend WAMI : /api/admin/contracts…)
  route("GET", `${A}/contracts`, "contracts", () => {
    const items = db().contracts.map((c) => {
      const paid = c.payments.reduce((s, p) => s + p.amount, 0);
      const elapsed = Math.max(0, Math.min(c.weeks, Math.floor((Date.now() - new Date(c.startDate).getTime()) / (7 * 86_400_000))));
      const behind = Math.max(0, Math.min(c.totalPrice, elapsed * c.weeklyInstallment) - paid);
      const [make = "", ...model] = c.vehicleLabel.split(" ");
      return {
        id: c.id,
        driverId: db().drivers.find((d) => d.name === c.driverName)?.id ?? "unknown",
        dateDebut: c.startDate,
        dateFinPrevue: new Date(new Date(c.startDate).getTime() + c.weeks * 7 * 86_400_000).toISOString(),
        frequenceEcheances: "HEBDOMADAIRE",
        nbEcheances: c.weeks,
        montantTotal: c.totalPrice,
        downPayment: c.deposit,
        montantEcheance: c.weeklyInstallment,
        montantPaye: paid,
        montantRestant: Math.max(0, c.totalPrice - paid),
        statut: c.status === "active" ? "ACTIF" : c.status === "suspended" ? "SUSPENDU" : c.status === "completed" ? "TERMINE" : "ROMPU",
        nbImpayes: behind > 0 ? Math.ceil(behind / c.weeklyInstallment) : 0,
        modeRemboursement: "ECHEANCIER",
        vehicle: { licensePlate: c.plate, make, model: model.join(" ") },
      };
    });
    return { items, total: items.length, page: 1, limit: 100 };
  }),
  route("GET", `${A}/contracts/:id/installments`, "contracts", ({ params }) => {
    const c = find(db().contracts, (x) => x.id === params.id);
    let credit = c.payments.reduce((s, p) => s + p.amount, 0);
    const items = Array.from({ length: Math.min(c.weeks, 12) }, (_, i) => {
      const due = new Date(new Date(c.startDate).getTime() + (i + 1) * 7 * 86_400_000);
      const paid = Math.min(c.weeklyInstallment, credit);
      credit -= paid;
      const status = paid >= c.weeklyInstallment ? "PAYEE" : due.getTime() > Date.now() ? "EN_ATTENTE" : paid > 0 ? "PARTIELLEMENT_RECOUVREE" : "IMPAYEE";
      return { id: `${c.id}-i${i + 1}`, numero: i + 1, dateEcheance: due.toISOString(), montant: c.weeklyInstallment, montantPaye: paid, statut: status };
    });
    return { contractId: c.id, items };
  }),
  route("POST", `${A}/contracts/:id/manual-payment`, "contracts", ({ params, body, user }) => {
    const c = find(db().contracts, (x) => x.id === params.id);
    const amount = num(body, "amount");
    const paid = c.payments.reduce((s, p) => s + p.amount, 0);
    if (!(amount > 0) || amount > c.totalPrice - paid) throw invalid("Montant invalide.");
    requireText(str(body, "reference"), 1, "reference is required");
    const method = body.paymentMethod === "ESPECES" ? "cash" : "momo";
    const payments = [...c.payments, { id: newId("pay"), date: new Date().toISOString(), amount, method } as const];
    const settled = payments.reduce((s, p) => s + p.amount, 0) >= c.totalPrice;
    audit(user, "Argent", `A encaissé ${amount} F · contrat ${c.id} (${c.driverName})`);
    replace(db().contracts, (x) => x.id === c.id, { ...c, payments: [...payments], status: settled ? "completed" : c.status });
    return { amount, imputedAmount: amount, installmentsSettled: 0, installmentsPartiallyPaid: 0, contractCompleted: settled };
  }),
  ...(["suspend", "resume", "break"] as const).map((action) =>
    route("POST", `${A}/contracts/:id/${action}`, "contracts", ({ params, body, user }) => {
      const c = find(db().contracts, (x) => x.id === params.id);
      if (action === "break") requireText(str(body, "reason"), 1, "reason is required");
      const status = action === "suspend" ? "suspended" : action === "resume" ? "active" : "terminated";
      audit(user, "Argent", `Contrat ${c.id} : ${action}`);
      replace(db().contracts, (x) => x.id === c.id, { ...c, status });
      return { id: c.id, statut: status };
    }),
  ),

  // ── Primes chauffeurs ── (contrat du backend WAMI : /api/admin/driver-bonus/…)
  ...(["config", "activity-config", "quality-config"] as const).flatMap((kind) => {
    const list = bonusConfigs[kind];
    return [
      route("GET", `${A}/driver-bonus/${kind}`, "driver-bonus", () => list),
      ...(["activate", "deactivate"] as const).map((action) =>
        route("POST", `${A}/driver-bonus/${kind}/:id/${action}`, "driver-bonus", ({ params, user }) => {
          const c = find(list, (x) => x.id === params.id);
          audit(user, "Argent", `Prime « ${c.name} » : ${action}`);
          for (const x of list) x.isActive = action === "activate" ? x.id === c.id : x.isActive && x.id !== c.id;
          return { id: c.id, isActive: c.isActive };
        }),
      ),
      route("POST", `${A}/driver-bonus/${kind}`, "driver-bonus", ({ body, user }) => {
        if (!str(body, "name") || !Array.isArray(body.tiers) || body.tiers.length === 0) throw invalid("name et tiers obligatoires");
        const c: MockBonus = { id: newId("bc"), name: str(body, "name"), description: null, vehicleCategory: str(body, "vehicleCategory") || "ALL", isActive: false, tiers: body.tiers as Array<Record<string, unknown>>, ...(typeof body.minRidesPerMonth === "number" ? { minRidesPerMonth: body.minRidesPerMonth } : {}) };
        list.push(c);
        audit(user, "Argent", `Prime « ${c.name} » créée`);
        return { id: c.id };
      }),
      route("PUT", `${A}/driver-bonus/${kind}/:id`, "driver-bonus", ({ params, body, user }) => {
        const c = find(list, (x) => x.id === params.id);
        if (Array.isArray(body.tiers) && body.tiers.length === 0) throw invalid("tiers ne peut pas être vide");
        Object.assign(c, { name: str(body, "name") || c.name, ...(Array.isArray(body.tiers) ? { tiers: body.tiers } : {}), ...(typeof body.minRidesPerMonth === "number" ? { minRidesPerMonth: body.minRidesPerMonth } : {}) });
        audit(user, "Argent", `Prime « ${c.name} » modifiée`);
        return { id: c.id };
      }),
      route("DELETE", `${A}/driver-bonus/${kind}/:id`, "driver-bonus", ({ params, user }) => {
        const c = find(list, (x) => x.id === params.id);
        if (c.isActive) throw invalid("Cannot delete an active configuration");
        list.splice(list.indexOf(c), 1);
        audit(user, "Argent", `Prime « ${c.name} » supprimée`);
        return { id: c.id };
      }),
    ];
  }),
  route("GET", `${A}/driver-bonus/awards`, "driver-bonus", () => [{ id: "aw-1", driverId: "drv-1", vehicleCategory: "MOTO", ridesThreshold: 50, bonusAmount: 5000, configId: "bt-1", transactionId: "tx-1", awardedAt: new Date().toISOString() }]),
  route("GET", `${A}/driver-bonus/activity-ledger`, "driver-bonus", () => [{ id: "al-1", driverId: "drv-2", vehicleCategory: "MOTO", activityDate: "2026-11-04", ridesCount: 14, netAmount: 21000, tierPctApplied: 3, bonusAmount: 630, configId: "ba-1", paid: false, paidAt: null, transactionId: null, createdAt: new Date().toISOString() }]),
  route("GET", `${A}/driver-bonus/activity-payouts`, "driver-bonus", () => [{ id: "ap-1", driverId: "drv-2", payoutRunDate: "2026-11-03", coveredLedgerIds: ["al-0"], totalAmount: 3200, transactionId: "tx-2", createdAt: new Date().toISOString() }]),
  route("GET", `${A}/driver-bonus/quality-ledger`, "driver-bonus", () => [{ id: "ql-1", driverId: "drv-1", vehicleCategory: "MOTO", yearMonth: "2026-10", ridesCount: 210, averageRating: 4.8, bonusAmount: 8000, configId: "bq-1", transactionId: "tx-3", awardedAt: new Date().toISOString() }]),
  route("GET", `${A}/driver-bonus/run-config`, "driver-bonus", () => bonusRun),
  route("PUT", `${A}/driver-bonus/run-config`, "driver-bonus", ({ body, user }) => {
    for (const k of ["welcomeBonusEnabled", "activityBonusEnabled", "qualityBonusEnabled"] as const) if (typeof body[k] === "boolean") bonusRun[k] = body[k];
    audit(user, "Argent", "Calendrier des primes modifié");
    return bonusRun;
  }),

  // ── Défis chauffeurs ── (route absente du backend : données fictives)
  route("GET", `${A}/driver-bonus/challenges`, "driver-bonus", () => db().challenges),
  route("POST", `${A}/driver-bonus/challenges`, "driver-bonus", ({ body, user }) => {
    const c: Challenge = { ...(body as unknown as Omit<Challenge, "id" | "participants" | "achievers" | "archived">), id: newId("ch"), participants: 0, achievers: 0, archived: false };
    db().challenges.unshift(c);
    audit(user, "Argent", `A créé le challenge « ${c.title} » (${c.targetMissions} missions → ${c.reward} F)`);
    return c;
  }),
  route("PATCH", `${A}/driver-bonus/challenges/:id`, "driver-bonus", ({ params, user }) => {
    const c = find(db().challenges, (x) => x.id === params.id);
    audit(user, "Réglages", `A archivé le challenge « ${c.title} »`);
    return replace(db().challenges, (x) => x.id === c.id, { ...c, archived: true });
  }),

  // ── Établissements ──
  route("GET", `${A}/establishments`, "establishments", ({ query }) => {
    const activity = query.get("activity");
    return db().establishments.filter((e) => !activity || e.activity === activity);
  }),
  route("PUT", `${A}/establishments/:id/commission`, "establishments", ({ params, body, user }) => {
    const e = find(db().establishments, (x) => x.id === params.id);
    const rate = typeof body.rate === "number" ? body.rate : null;
    if (rate !== null && (rate < 0 || rate > 0.3)) throw invalid("Commission entre 0 et 30 %.");
    audit(user, "Argent", `Commission de ${e.name} : ${rate === null ? "taux par défaut" : `${Math.round(rate * 100)} %`}`);
    return replace(db().establishments, (x) => x.id === e.id, { ...e, commissionRate: rate });
  }),
  route("POST", `${A}/establishments/:id/status`, "establishments", ({ params, body, user }) => {
    const e = find(db().establishments, (x) => x.id === params.id);
    const status = body.status === "suspended" ? "suspended" : "open";
    audit(user, "Comptes", `${status === "suspended" ? "A suspendu" : "A réactivé"} ${e.name} · ${str(body, "reason")}`);
    return replace(db().establishments, (x) => x.id === e.id, { ...e, status });
  }),
];
