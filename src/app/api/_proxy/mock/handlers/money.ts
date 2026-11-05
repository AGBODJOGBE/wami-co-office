import "server-only";
import { audit, db, newId } from "../db";
import { find, num, replace, requireText, str } from "../helpers";
import { MockError, invalid, route, type MockRoute } from "../router";
import type { Campaign, ReferralProgram } from "../seed-types";

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
  // Même contrat que le backend WAMI : wallets, transactions, blocage des retraits.
  route("GET", `${A}/wallets`, "wallet", () => {
    const wallets = db().wallets.map((w) => ({
      walletId: w.id,
      walletType: w.ownerType === "client" ? "PAYMENT" : w.ownerType === "platform" ? "PLATFORM" : "EARNINGS",
      totalBalance: w.balance,
      status: w.status === "active" ? "ACTIVE" : "SUSPENDED",
      withdrawalsBlocked: w.withdrawalsBlocked,
      withdrawalsBlockedReason: w.withdrawalsBlockedReason,
      ownerName: w.ownerName,
      ownerPhone: w.phone,
    }));
    return { wallets, total: wallets.length };
  }),
  route("GET", `${A}/transactions`, "wallet", ({ query }) => {
    const w = db().wallets.find((x) => x.id === query.get("walletId"));
    const transactions = (w ? w.movements : db().wallets.flatMap((x) => x.movements)).map((m) => ({
      transactionId: m.id,
      direction: m.amount < 0 ? "DEBIT" : "CREDIT",
      amount: Math.abs(m.amount),
      description: m.label,
      createdAt: m.at,
    }));
    return { transactions, total: transactions.length, page: 1, limit: 20 };
  }),
  route("PATCH", `${A}/wallets/:id/withdrawals/block`, "wallet", ({ params, body, user }) => {
    const w = find(db().wallets, (x) => x.id === params.id);
    const reason = str(body, "reason");
    requireText(reason, 1, "reason is required");
    audit(user, "Argent", `A bloqué les retraits de ${w.ownerName} · ${reason}`);
    replace(db().wallets, (x) => x.id === w.id, { ...w, withdrawalsBlocked: true, withdrawalsBlockedReason: reason });
    return { walletId: w.id, withdrawalsBlocked: true, withdrawalsBlockedReason: reason, withdrawalsBlockedAt: new Date().toISOString(), withdrawalsBlockedBy: user.id };
  }),
  route("PATCH", `${A}/wallets/:id/withdrawals/unblock`, "wallet", ({ params, user }) => {
    const w = find(db().wallets, (x) => x.id === params.id);
    audit(user, "Argent", `A débloqué les retraits de ${w.ownerName}`);
    replace(db().wallets, (x) => x.id === w.id, { ...w, withdrawalsBlocked: false, withdrawalsBlockedReason: null });
    return { walletId: w.id, withdrawalsBlocked: false, withdrawalsBlockedReason: null, withdrawalsBlockedAt: null, withdrawalsBlockedBy: null };
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

  // ── Codes promo ── (contrat du backend WAMI : /api/admin/promo-codes, PATCH …/:id/toggle)
  route("GET", `${A}/promo-codes`, "promo-codes", () =>
    db().promos.map((p) => ({
      id: p.id,
      code: p.code,
      campaignName: p.description,
      displayText: p.description,
      discountType: p.kind === "percent" ? "PERCENTAGE" : "FIXED_AMOUNT",
      discountValue: p.value,
      maxDiscountAmount: p.cap,
      startDate: p.startsAt,
      endDate: p.endsAt,
      maxTotalUsages: p.maxUses,
      currentUsages: p.used,
      vertical: p.services.every((s) => s === "delivery" || s === "meal") ? "DELIVERY_B2C" : "TRANSPORT",
      fundedBy: p.fundedBy === "wami" ? "WAMI" : "PARTNER",
      usageNumber: p.firstOrderOnly ? 1 : null,
      isActive: p.active,
    })),
  ),
  route("POST", `${A}/promo-codes`, "promo-codes", ({ body, user }) => {
    const code = str(body, "code");
    if (db().promos.some((x) => x.code === code)) throw invalid("Ce code existe déjà.");
    db().promos.unshift({
      id: code,
      code,
      description: str(body, "displayText"),
      kind: body.discountType === "PERCENTAGE" ? "percent" : "fixed",
      value: num(body, "discountValue"),
      cap: typeof body.maxDiscountAmount === "number" ? body.maxDiscountAmount : null,
      maxUses: num(body, "maxTotalUsages"),
      used: 0,
      services: body.vertical === "DELIVERY_B2C" ? ["delivery"] : ["ride"],
      startsAt: str(body, "startDate"),
      endsAt: str(body, "endDate"),
      fundedBy: body.fundedBy === "WAMI" ? "wami" : "shared",
      firstOrderOnly: body.usageNumber === 1,
      active: body.isActive !== false,
    });
    audit(user, "Argent", `A créé le code promo ${code}`);
    return { promoCodeId: code };
  }),
  route("PATCH", `${A}/promo-codes/:id/toggle`, "promo-codes", ({ params, user }) => {
    const p = find(db().promos, (x) => x.id === params.id);
    audit(user, "Argent", `A ${p.active ? "désactivé" : "activé"} le code ${p.code}`);
    replace(db().promos, (x) => x.id === p.id, { ...p, active: !p.active });
    return { isActive: !p.active };
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
