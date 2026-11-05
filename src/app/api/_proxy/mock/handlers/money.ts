import "server-only";
import { audit, db, newId } from "../db";
import { find, matches, num, replace, requireText, str } from "../helpers";
import { MockError, invalid, route, type MockRoute } from "../router";
import type { Campaign, PromoCode, ReferralProgram } from "../seed-types";

const A = "/v1/admin";

/** Support, portefeuilles, finances, promos, affiliation, parrainage, notifications. */
export const moneyRoutes: MockRoute[] = [
  // ── Support ──
  route("GET", `${A}/support/tickets`, "support", () => db().tickets),
  route("POST", `${A}/support/tickets/:id/messages`, "support", ({ params, body, user }) => {
    const t = find(db().tickets, (x) => x.id === params.id);
    const text = str(body, "text");
    requireText(text, 2, "Message vide.");
    const message = { id: newId("msg"), from: body.internal === true ? ("note" as const) : ("agent" as const), author: user.name, text, at: new Date().toISOString() };
    return replace(db().tickets, (x) => x.id === t.id, { ...t, assignee: t.assignee ?? user.name, status: "waiting", messages: [...t.messages, message] });
  }),
  route("POST", `${A}/support/tickets/:id/refund`, "support", ({ params, body, user }) => {
    const t = find(db().tickets, (x) => x.id === params.id);
    const amount = num(body, "amount");
    if (!t.payment) throw invalid("Aucun paiement lié.");
    if (!(amount > 0) || amount > t.payment.paid - t.payment.alreadyRefunded) throw invalid("Montant supérieur au remboursable.");
    // Le backend applique aussi le plafond par rôle.
    if (user.role === "support" && amount > 5000) throw new MockError(403, "Au-delà de 5 000 F, la Finance doit valider.", "refund_cap");
    audit(user, "Argent", `A remboursé ${amount} F · ticket ${t.id} (${t.payment.reference})`);
    const note = { id: newId("msg"), from: "note" as const, author: user.name, text: `Remboursement de ${amount} F effectué.`, at: new Date().toISOString() };
    return replace(db().tickets, (x) => x.id === t.id, {
      ...t,
      payment: { ...t.payment, alreadyRefunded: t.payment.alreadyRefunded + amount },
      messages: [...t.messages, note],
    });
  }),
  route("POST", `${A}/support/tickets/:id/close`, "support", ({ params, user }) => {
    const t = find(db().tickets, (x) => x.id === params.id);
    audit(user, "Opérations", `A clos le ticket ${t.id}`);
    return replace(db().tickets, (x) => x.id === t.id, { ...t, status: "closed" });
  }),

  // ── Portefeuilles ──
  route("GET", `${A}/wallets`, "wallet", ({ query }) => {
    const q = query.get("q") ?? "";
    return db().wallets.filter((w) => matches(q, w.ownerName, w.phone));
  }),
  route("POST", `${A}/wallets/:id/adjustments`, "wallet", ({ params, body, user }) => {
    const w = find(db().wallets, (x) => x.id === params.id);
    const amount = num(body, "amount");
    const reason = str(body, "reason");
    requireText(reason, 10, "Motif obligatoire.");
    if (!Number.isInteger(amount) || amount === 0) throw invalid("Montant invalide.");
    audit(user, "Argent", `Ajustement de ${amount} F sur le portefeuille de ${w.ownerName} · ${reason}`);
    return replace(db().wallets, (x) => x.id === w.id, {
      ...w,
      balance: w.balance + amount,
      movements: [{ id: newId("wm"), at: new Date().toISOString(), label: `Ajustement : ${reason}`, amount }, ...w.movements],
    });
  }),

  // ── Finances ──
  route("GET", `${A}/finance/summary`, "finance", () => db().financeSummary),
  route("GET", `${A}/finance/payout-batches/current`, "finance", () => db().batch),
  route("POST", `${A}/finance/payout-batches/current/submit`, "finance", ({ body, user }) => {
    const b = db().batch;
    if (b.status !== "draft") throw invalid("Lot déjà soumis.");
    const ids = Array.isArray(body.selectedIds) ? body.selectedIds.filter((x): x is string => typeof x === "string") : [];
    if (ids.length === 0) throw invalid("Sélection vide.");
    audit(user, "Argent", `A préparé le lot de versement (${ids.length} bénéficiaires) · en attente de validation`);
    db().batch = { ...b, status: "submitted", preparedBy: user.id, selectedIds: ids };
    return db().batch;
  }),
  route("POST", `${A}/finance/payout-batches/current/approve`, "finance", ({ user }) => {
    const b = db().batch;
    if (b.status !== "submitted") throw invalid("Le lot doit être soumis.");
    if (b.preparedBy === user.id) throw new MockError(403, "Double validation : une autre personne doit approuver.", "four_eyes");
    audit(user, "Argent", "A approuvé le lot de versement");
    db().batch = { ...b, status: "approved", approvedBy: user.id };
    return db().batch;
  }),

  // ── Codes promo ──
  route("GET", `${A}/promo-codes`, "promo-codes", () => db().promos),
  route("POST", `${A}/promo-codes`, "promo-codes", ({ body, user }) => {
    const p = body as unknown as PromoCode;
    if (db().promos.some((x) => x.code === p.code)) throw invalid("Ce code existe déjà.");
    db().promos.unshift(p);
    audit(user, "Argent", `A créé le code promo ${p.code}`);
    return p;
  }),
  route("PATCH", `${A}/promo-codes/:code`, "promo-codes", ({ params, body, user }) => {
    const p = find(db().promos, (x) => x.code === params.code);
    const active = body.active === true;
    audit(user, "Argent", `${active ? "A activé" : "A désactivé"} le code ${p.code}`);
    return replace(db().promos, (x) => x.code === p.code, { ...p, active });
  }),

  // ── Affiliation ──
  route("GET", `${A}/affiliates`, "affiliate", () => db().affiliates),
  route("POST", `${A}/affiliates/:id/payouts`, "affiliate", ({ params, body, user }) => {
    const a = find(db().affiliates, (x) => x.id === params.id);
    const amount = num(body, "amount");
    if (!(amount > 0) || amount > a.activations * a.ratePerActivation - a.paid) throw invalid("Montant supérieur au dû.");
    audit(user, "Argent", `A versé ${amount} F à l’affilié ${a.name}`);
    return replace(db().affiliates, (x) => x.id === a.id, { ...a, paid: a.paid + amount });
  }),

  // ── Parrainage ──
  route("GET", `${A}/referrals/program`, "referrals", () => db().referralProgram),
  route("PUT", `${A}/referrals/program`, "referrals", ({ body, user }) => {
    db().referralProgram = body as unknown as ReferralProgram;
    audit(user, "Réglages", "A modifié le programme de parrainage");
    return db().referralProgram;
  }),
  route("GET", `${A}/referrals`, "referrals", () => db().referrals),
  route("POST", `${A}/referrals/:id/flag`, "referrals", ({ params, body, user }) => {
    const r = find(db().referrals, (x) => x.id === params.id);
    audit(user, "Comptes", `A bloqué le parrainage ${r.referrerName} → ${r.refereeName} · ${str(body, "reason")}`);
    return replace(db().referrals, (x) => x.id === r.id, { ...r, status: "flagged" });
  }),

  // ── Notifications ──
  route("GET", `${A}/notifications/campaigns`, "notifications", () => db().campaigns),
  route("POST", `${A}/notifications/campaigns`, "notifications", ({ body, user }) => {
    const draft = body as unknown as Pick<Campaign, "title" | "body" | "audience" | "channel" | "zone" | "scheduledAt">;
    const recipients = { clients: 12_840, pros: 1_040, establishments: 186, all: 14_066 }[draft.audience];
    const c: Campaign = { ...draft, id: newId("cp"), status: draft.scheduledAt ? "scheduled" : "sent", recipients, createdBy: user.name };
    db().campaigns.unshift(c);
    audit(user, "Opérations", `A ${c.status === "sent" ? "envoyé" : "programmé"} une campagne ${c.channel.toUpperCase()} à ${recipients} destinataires`);
    return c;
  }),
];
