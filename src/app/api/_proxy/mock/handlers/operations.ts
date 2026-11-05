import "server-only";
import { audit, db } from "../db";
import { find, matches, replace, requireText, str } from "../helpers";
import { invalid, route, type MockRoute } from "../router";
import type { Overview, ParcelType, SearchHit } from "../seed-types";

const A = "/v1/admin";

/** Tableau de bord, opérations en direct, courses, livraisons, tournées, B2B, offres, colis, recherche. */
export const operationsRoutes: MockRoute[] = [
  route("GET", `${A}/dashboard`, "dashboard", (): Overview => {
    const d = db();
    const pendingDossiers = d.dossiers.filter((x) => !x.activated).length;
    const failedPayouts = d.batch.lines.filter((l) => l.status === "failed").length;
    const sos = d.missions.find((m) => m.status === "sos" && !m.sosAcknowledgedBy);
    return {
      volume: 4_812_500,
      commission: 612_300,
      completedMissions: 1284,
      onlinePartners: 312,
      activePartners: 1040,
      cancellationRate: 0.061,
      byService: [
        { kind: "ride", label: "Courses (moto, auto)", missions: 742, volume: 1_336_000, commission: 200_400, trend: 0.06 },
        { kind: "parcel", label: "Colis", missions: 214, volume: 481_500, commission: 72_200, trend: 0.11 },
        { kind: "meal", label: "Repas (restaurants)", missions: 186, volume: 912_000, commission: 109_400, trend: -0.03 },
        { kind: "lodging", label: "Hôtels et chambres (nuits)", missions: 41, volume: 1_287_000, commission: 154_400, trend: 0.02 },
        { kind: "rental", label: "Location (visites)", missions: 17, volume: 0, commission: 0, trend: 0 },
        { kind: "bus", label: "Billets de bus", missions: 84, volume: 796_000, commission: 75_900, trend: 0.14 },
      ],
      hourly: [8, 4, 3, 2, 3, 12, 38, 74, 92, 61, 55, 70, 81, 63, 52, 58, 79, 97, 112, 88, 66, 41, 25, 14],
      todo: [
        ...(sos ? [{ id: "sos", title: `SOS · ${sos.id}`, detail: `${sos.pickup} → ${sos.dropoff} · non pris en charge`, href: "/live-ops", urgent: true }] : []),
        { id: "inc", title: `${d.incidents.filter((i) => i.status === "open").length} incidents ouverts`, detail: "Objet oublié, client injoignable", href: "/live-ops", urgent: false },
        { id: "docs", title: `${pendingDossiers} dossiers partenaires à vérifier`, detail: "Le plus ancien attend depuis 30 h", href: "/documents", urgent: false },
        { id: "payouts", title: `${failedPayouts} versement(s) en échec`, detail: "Numéro Mobile Money refusé", href: "/finance", urgent: false },
        { id: "insurance", title: "2 assurances expirent bientôt", detail: "Les comptes seront bloqués à l’échéance", href: "/vehicles", urgent: false },
        { id: "support", title: `${d.tickets.filter((t) => t.status !== "closed").length} tickets support ouverts`, detail: "Dont 1 hors délai", href: "/support", urgent: false },
      ],
    };
  }),

  // ── En direct ──
  route("GET", `${A}/live/missions`, "live-ops", () => db().missions),
  route("POST", `${A}/live/missions/:id/sos/ack`, "live-ops", ({ params, user }) => {
    const m = find(db().missions, (x) => x.id === params.id);
    if (m.status !== "sos") throw invalid("Pas d’alerte SOS sur cette mission.");
    const updated = {
      ...m,
      sosAcknowledgedBy: user.name,
      timeline: [...m.timeline, { at: new Date().toISOString(), label: `SOS pris en charge par ${user.name}` }],
    };
    audit(user, "Opérations", `A pris en charge le SOS · ${m.id}`);
    return replace(db().missions, (x) => x.id === m.id, updated);
  }),
  route("POST", `${A}/live/missions/:id/reassign`, "live-ops", ({ params, user }) => {
    const m = find(db().missions, (x) => x.id === params.id);
    audit(user, "Opérations", `A relancé la recherche d’un partenaire · ${m.id}`);
    return replace(db().missions, (x) => x.id === m.id, {
      ...m,
      status: "searching",
      partnerName: null,
      etaMinutes: null,
      timeline: [...m.timeline, { at: new Date().toISOString(), label: `Réassignation demandée par ${user.name}` }],
    });
  }),
  route("POST", `${A}/live/missions/:id/cancel`, "live-ops", ({ params, body, user }) => {
    const reason = str(body, "reason");
    requireText(reason, 5, "Motif obligatoire.");
    const m = find(db().missions, (x) => x.id === params.id);
    db().missions = db().missions.filter((x) => x.id !== m.id);
    audit(user, "Opérations", `A annulé ${m.id} et remboursé le client · motif : ${reason}`);
    return { ...m, timeline: [...m.timeline, { at: new Date().toISOString(), label: `Annulée : ${reason}`, alert: true }] };
  }),
  route("GET", `${A}/incidents`, "live-ops", () => db().incidents),
  route("POST", `${A}/incidents/:id/resolve`, "live-ops", ({ params, user }) => {
    const i = find(db().incidents, (x) => x.id === params.id);
    audit(user, "Opérations", `A résolu l’incident ${i.id}`);
    return replace(db().incidents, (x) => x.id === i.id, { ...i, status: "resolved" });
  }),

  // ── Courses ──
  route("GET", `${A}/rides`, "rides", ({ query }) => {
    const status = query.get("status");
    const q = query.get("q") ?? "";
    return db().rides.filter((r) => (!status || r.status === status) && matches(q, r.id, r.customerName, r.driverName ?? ""));
  }),
  route("POST", `${A}/rides/:id/cancel`, "rides", ({ params, body, user }) => {
    const reason = str(body, "reason");
    requireText(reason, 5, "Motif obligatoire.");
    const r = find(db().rides, (x) => x.id === params.id);
    if (r.status !== "inProgress") throw invalid("Seule une course en cours peut être annulée.");
    audit(user, "Opérations", `A annulé la course ${r.id} · ${reason}`);
    return replace(db().rides, (x) => x.id === r.id, { ...r, status: "cancelled", cancelReason: reason, cancelledBy: "admin" });
  }),

  // ── Livraisons ──
  route("GET", `${A}/deliveries`, "delivery", ({ query }) => {
    const type = query.get("type");
    return db().deliveries.filter((d) => !type || d.type === type);
  }),
  route("POST", `${A}/deliveries/:id/cancel`, "delivery", ({ params, body, user }) => {
    const d = find(db().deliveries, (x) => x.id === params.id);
    audit(user, "Opérations", `A annulé la livraison ${d.id} · ${str(body, "reason")}`);
    return replace(db().deliveries, (x) => x.id === d.id, { ...d, status: "cancelled" });
  }),

  // ── B2B ──
  route("GET", `${A}/b2b/accounts`, "delivery-b2b", () => db().b2bAccounts),
  route("GET", `${A}/b2b/accounts/:id/invoices`, "delivery-b2b", ({ params }) => db().invoices[params.id!] ?? []),
  route("PATCH", `${A}/b2b/accounts/:id`, "delivery-b2b", ({ params, body, user }) => {
    const a = find(db().b2bAccounts, (x) => x.id === params.id);
    const next = { ...a };
    if (typeof body.creditLimit === "number") {
      if (body.creditLimit < a.outstanding) throw invalid("Plafond inférieur à l’encours.");
      next.creditLimit = body.creditLimit;
      audit(user, "Argent", `Plafond B2B de ${a.company} : ${a.creditLimit} F → ${body.creditLimit} F`);
    }
    if (body.status === "active" || body.status === "suspended") {
      next.status = body.status;
      audit(user, "Comptes", `${body.status === "active" ? "A réactivé" : "A suspendu"} le compte B2B ${a.company}`);
    }
    return replace(db().b2bAccounts, (x) => x.id === a.id, next);
  }),

  // ── Tournées ──
  route("GET", `${A}/rounds`, "rounds", () => db().rounds),
  route("GET", `${A}/rounds/available-couriers`, "rounds", () => db().couriers),
  route("POST", `${A}/rounds/:id/assign`, "rounds", ({ params, body, user }) => {
    const r = find(db().rounds, (x) => x.id === params.id);
    const c = find(db().couriers, (x) => x.id === str(body, "courierId"), "Livreur introuvable.");
    if (!c.online || c.busy) throw invalid(`${c.name} n’est pas disponible.`);
    replace(db().couriers, (x) => x.id === c.id, { ...c, busy: true });
    audit(user, "Opérations", `A affecté ${r.name} à ${c.name}`);
    return replace(db().rounds, (x) => x.id === r.id, { ...r, courierId: c.id, courierName: c.name });
  }),

  // ── Offres VTC ──
  route("GET", `${A}/vtc/categories`, "vtc", () => db().vtc),
  route("PATCH", `${A}/vtc/categories/:key`, "vtc", ({ params, body, user }) => {
    const c = find(db().vtc, (x) => x.key === params.key);
    const active = body.active === true;
    if (!active && db().vtc.filter((x) => x.active && x.key !== c.key).length === 0) throw invalid("Dernière offre active.");
    audit(user, "Réglages", `${active ? "A activé" : "A masqué"} l’offre ${c.label}`);
    return replace(db().vtc, (x) => x.key === c.key, { ...c, active });
  }),

  // ── Types de colis ──
  route("GET", `${A}/parcel-types`, "parcel-types", () => db().parcelTypes),
  route("POST", `${A}/parcel-types`, "parcel-types", ({ body, user }) => {
    const t = body as unknown as ParcelType;
    if (db().parcelTypes.some((x) => x.code === t.code)) throw invalid("Ce code existe déjà.");
    db().parcelTypes.push(t);
    audit(user, "Réglages", `A créé le type de colis ${t.code} · ${t.label}`);
    return t;
  }),
  route("PUT", `${A}/parcel-types/:code`, "parcel-types", ({ params, body, user }) => {
    const t = { ...(body as unknown as ParcelType), code: params.code! };
    audit(user, "Réglages", `A modifié le type de colis ${t.code}`);
    return replace(db().parcelTypes, (x) => x.code === params.code, t);
  }),

  // ── Recherche ──
  route("GET", `${A}/search`, "search", ({ query }): SearchHit[] => {
    const q = (query.get("q") ?? "").trim();
    if (q.length < 2) return [];
    const d = db();
    return [
      ...d.missions.filter((m) => matches(q, m.id, m.customerName, m.partnerName ?? "")).map((m) => ({ kind: "mission" as const, id: m.id, title: `${m.id} · ${m.label}`, subtitle: `${m.pickup} → ${m.dropoff}`, href: "/live-ops" })),
      ...d.rides.filter((r) => matches(q, r.id, r.customerName)).map((r) => ({ kind: "mission" as const, id: `ride-${r.id}`, title: `${r.id} · course`, subtitle: `${r.from} → ${r.to}`, href: "/rides" })),
      ...d.drivers.filter((x) => matches(q, x.name, x.phone, x.vehicle)).map((x) => ({ kind: "driver" as const, id: x.id, title: x.name, subtitle: `${x.phone} · ${x.vehicle}`, href: "/drivers" })),
      ...d.establishments.filter((e) => matches(q, e.name, e.district)).map((e) => ({ kind: "establishment" as const, id: e.id, title: e.name, subtitle: e.district, href: "/establishments" })),
      ...d.wallets.filter((w) => w.ownerType === "client" && matches(q, w.ownerName, w.phone)).map((w) => ({ kind: "client" as const, id: w.id, title: w.ownerName, subtitle: w.phone, href: "/wallet" })),
      ...d.tickets.filter((t) => matches(q, t.id, t.subject, t.requesterName)).map((t) => ({ kind: "ticket" as const, id: t.id, title: `${t.id} · ${t.subject}`, subtitle: t.requesterName, href: "/support" })),
    ].slice(0, 40);
  }),
];

