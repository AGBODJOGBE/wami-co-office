import "server-only";
import { audit, db, newId } from "../db";
import { find, num, replace, requireText, str } from "../helpers";
import { invalid, route, type MockRoute } from "../router";
import type { Challenge } from "../seed-types";

const A = "/v1/admin";

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

  // ── Location-vente ──
  route("GET", `${A}/lease-contracts`, "contracts", () => db().contracts),
  route("POST", `${A}/lease-contracts/:id/payments`, "contracts", ({ params, body, user }) => {
    const c = find(db().contracts, (x) => x.id === params.id);
    const amount = num(body, "amount");
    const paid = c.payments.reduce((s, p) => s + p.amount, 0);
    if (!(amount > 0) || amount > c.totalPrice - paid) throw invalid("Montant invalide.");
    const method = (["cash", "momo", "earnings"] as const).find((m) => m === body.method) ?? "momo";
    const payments = [...c.payments, { id: newId("pay"), date: new Date().toISOString(), amount, method }];
    const settled = payments.reduce((s, p) => s + p.amount, 0) >= c.totalPrice;
    audit(user, "Argent", `A encaissé ${amount} F · contrat ${c.id} (${c.driverName})`);
    return replace(db().contracts, (x) => x.id === c.id, { ...c, payments, status: settled ? "completed" : c.status });
  }),

  // ── Primes ──
  route("GET", `${A}/driver-bonus/challenges`, "driver-bonus", () => db().challenges),
  route("POST", `${A}/driver-bonus/challenges`, "driver-bonus", ({ body, user }) => {
    const c: Challenge = {
      ...(body as unknown as Omit<Challenge, "id" | "participants" | "achievers" | "archived">),
      id: newId("ch"),
      participants: 0,
      achievers: 0,
      archived: false,
    };
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
