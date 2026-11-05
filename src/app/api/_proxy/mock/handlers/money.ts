import "server-only";
import { audit, db, newId } from "../db";
import { find, num, replace, requireText, str } from "../helpers";
import { MockError, invalid, route, type MockRoute } from "../router";
import type { Campaign, ReferralProgram } from "../seed-types";

const A = "/v1/admin";

const grantIds = (body: Record<string, unknown>): string[] => {
  const t = body.targeting as { beneficiaryIds?: unknown } | undefined;
  return Array.isArray(t?.beneficiaryIds) ? t.beneficiaryIds.filter((x): x is string => typeof x === "string") : [];
};

/** Dotations de démonstration (état en mémoire, comme le reste du faux backend). */
const mockGrants: Array<{ campaignId: string; audience: string; label: string; balanceType: string; amountPerBeneficiary: number; beneficiaryCount: number; totalAmount: number; status: string; createdBy: string; createdAt: string; approvedBy: string | null; creditedCount: number; failedCount: number }> = [
  { campaignId: "gr-1", audience: "DRIVER", label: "Geste commercial Tabaski", balanceType: "BONUS", amountPerBeneficiary: 2000, beneficiaryCount: 120, totalAmount: 240_000, status: "PENDING_APPROVAL", createdBy: "agent-operations", createdAt: new Date().toISOString(), approvedBy: null, creditedCount: 0, failedCount: 0 },
  { campaignId: "gr-2", audience: "PASSENGER", label: "Compensation incident réseau", balanceType: "BONUS", amountPerBeneficiary: 500, beneficiaryCount: 300, totalAmount: 150_000, status: "PARTIALLY_FAILED", createdBy: "agent-operations", createdAt: new Date().toISOString(), approvedBy: "agent-finance", creditedCount: 292, failedCount: 8 },
];

/** Retraits de démonstration (état en mémoire, comme le reste du faux backend). */
const mockWithdrawals: Array<{ withdrawalId: string; walletId: string; ownerName: string; ownerPhone: string; amount: number; method: string; recipientDetails: { phone?: string }; status: string; reference: string | null; failureReason: string | null; rejectionReason: string | null; sourceBalance: string; affiliateSummary: { outstandingPayable: number } | null; createdAt: string }> = [
  { withdrawalId: "wd-1", walletId: "w-2", ownerName: "[Chauffeur] Koffi A.", ownerPhone: "+229 01 97 00 00 01", amount: 25_000, method: "MOBILE_MONEY", recipientDetails: { phone: "+229 01 97 00 00 01" }, status: "AWAITING_APPROVAL", reference: null, failureReason: null, rejectionReason: null, sourceBalance: "MAIN", affiliateSummary: null, createdAt: new Date().toISOString() },
  { withdrawalId: "wd-2", walletId: "w-1", ownerName: "[Apporteur] Théophile K.", ownerPhone: "+229 01 96 00 20 20", amount: 40_000, method: "MOBILE_MONEY", recipientDetails: { phone: "+229 01 96 00 20 20" }, status: "AWAITING_APPROVAL", reference: null, failureReason: null, rejectionReason: null, sourceBalance: "AFFILIATE", affiliateSummary: { outstandingPayable: 40_000 }, createdAt: new Date().toISOString() },
  { withdrawalId: "wd-3", walletId: "w-4", ownerName: "Le Palmier", ownerPhone: "+229 01 •• •• 42", amount: 300_000, method: "MOBILE_MONEY", recipientDetails: { phone: "+229 01 •• •• 42" }, status: "COMPLETED", reference: "MOMO-7781", failureReason: null, rejectionReason: null, sourceBalance: "MAIN", affiliateSummary: null, createdAt: new Date().toISOString() },
];

/** Configurations de parrainage de démonstration (état en mémoire, comme le reste du faux backend). */
const referralConfigs: Array<{
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  rewardMatrix: Array<{ referrerType: string; referredType: string; rewardMode: "FIXED" | "PERCENTAGE"; referrerAmount: number; referredAmount: number }>;
  validationConditions: { expirationDays: number | null };
  activatedAt: string | null;
}> = [
  { id: "rc-1", name: "Lancement passagers", description: "Parrainage passager → passager", isActive: true, rewardMatrix: [{ referrerType: "PASSENGER", referredType: "PASSENGER", rewardMode: "FIXED", referrerAmount: 1000, referredAmount: 500 }], validationConditions: { expirationDays: 30 }, activatedAt: new Date().toISOString() },
  { id: "rc-2", name: "Chauffeurs (brouillon)", description: null, isActive: false, rewardMatrix: [{ referrerType: "DRIVER_STANDARD", referredType: "DRIVER_STANDARD", rewardMode: "FIXED", referrerAmount: 5000, referredAmount: 0 }], validationConditions: { expirationDays: null }, activatedAt: null },
];

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

  // Retraits (contrat du backend WAMI : /api/admin/withdrawals, PATCH …/approve|reject).
  route("GET", `${A}/withdrawals`, "withdrawals", ({ query }) => {
    const status = query.get("status");
    const withdrawals = mockWithdrawals.filter((w) => !status || w.status === status);
    return { withdrawals, total: withdrawals.length, page: 1, limit: 100 };
  }),
  route("PATCH", `${A}/withdrawals/:id/approve`, "withdrawals", ({ params, user }) => {
    const w = find(mockWithdrawals, (x) => x.withdrawalId === params.id);
    if (w.status !== "AWAITING_APPROVAL") throw invalid("Withdrawal is not awaiting approval");
    w.status = "PROCESSING";
    audit(user, "Argent", `A approuvé le retrait de ${w.amount} F (${w.ownerName})`);
    return { withdrawalId: w.withdrawalId, status: w.status };
  }),
  route("PATCH", `${A}/withdrawals/:id/reject`, "withdrawals", ({ params, body, user }) => {
    const w = find(mockWithdrawals, (x) => x.withdrawalId === params.id);
    const reason = str(body, "reason");
    requireText(reason, 1, "reason is required");
    if (w.status !== "AWAITING_APPROVAL") throw invalid("Withdrawal is not awaiting approval");
    w.status = "REJECTED";
    w.rejectionReason = reason;
    audit(user, "Argent", `A rejeté le retrait de ${w.amount} F (${w.ownerName}) · ${reason}`);
    return { withdrawalId: w.withdrawalId, status: w.status, refundedAmount: w.amount };
  }),

  // Dotations (contrat du backend WAMI : /api/admin/wallet/grants…).
  route("GET", `${A}/wallet/grants`, "wallet-grants", ({ query }) => {
    const status = query.get("status");
    const campaigns = mockGrants.filter((g) => !status || g.status === status);
    return { campaigns, total: campaigns.length, page: 1, limit: 100 };
  }),
  route("POST", `${A}/wallet/grants/preview`, "wallet-grants", ({ body }) => {
    const ids = grantIds(body);
    const amount = num(body, "amountPerBeneficiary");
    return { beneficiaryCount: ids.length, totalAmount: ids.length * amount, unknownIds: [], beneficiariesInOverdraft: 0, amountAbsorbedByDebt: 0, sample: [], capViolations: amount > 50_000 ? [{ cap: "maxPerBeneficiary", limit: 50_000, actual: amount }] : [], notes: [] };
  }),
  route("POST", `${A}/wallet/grants`, "wallet-grants", ({ body, user }) => {
    const ids = grantIds(body);
    const amount = num(body, "amountPerBeneficiary");
    const label = str(body, "label");
    if (!label || ids.length === 0 || !(amount > 0)) throw invalid("label, amountPerBeneficiary et bénéficiaires obligatoires");
    const g = { campaignId: newId("gr"), audience: str(body, "audience"), label, balanceType: str(body, "balanceType"), amountPerBeneficiary: amount, beneficiaryCount: ids.length, totalAmount: ids.length * amount, status: "PENDING_APPROVAL", createdBy: user.id, createdAt: new Date().toISOString(), approvedBy: null, creditedCount: 0, failedCount: 0 };
    mockGrants.unshift(g);
    audit(user, "Argent", `A demandé la dotation « ${label} » (${g.totalAmount} F)`);
    return { campaignId: g.campaignId, status: g.status, beneficiaryCount: g.beneficiaryCount, totalAmount: g.totalAmount };
  }),
  ...(["approve", "reject", "cancel", "retry-failed"] as const).map((action) =>
    route("POST", `${A}/wallet/grants/:id/${action}`, "wallet-grants", ({ params, body, user }) => {
      const g = find(mockGrants, (x) => x.campaignId === params.id);
      if (action === "reject") requireText(str(body, "reason"), 1, "reason is required");
      if ((action === "approve" || action === "reject") && g.status !== "PENDING_APPROVAL") throw new MockError(409, "La dotation n’est plus à approuver.", "conflict");
      if (action === "approve" && g.createdBy === user.id) throw new MockError(409, "Le demandeur ne peut pas approuver sa propre dotation.", "conflict");
      if (action === "retry-failed" && g.status !== "PARTIALLY_FAILED") throw new MockError(409, "Aucune ligne échouée.", "conflict");
      g.status = action === "approve" ? "COMPLETED" : action === "reject" ? "REJECTED" : action === "cancel" ? "CANCELLED" : "COMPLETED";
      if (action === "approve" || action === "retry-failed") {
        g.creditedCount = g.beneficiaryCount;
        g.failedCount = 0;
        g.approvedBy = user.id;
      }
      audit(user, "Argent", `Dotation « ${g.label} » : ${action}`);
      return { campaignId: g.campaignId, status: g.status };
    }),
  ),

  // Route absente du backend (faux backend) : ajustement manuel.
  route("POST", `${A}/wallets/:id/adjustments`, "wallet", ({ params, body, user }) => {
    const w = find(db().wallets, (x) => x.id === params.id, "Route absente du backend : l’ajustement ne marche que sur les portefeuilles fictifs.");
    const amount = num(body, "amount");
    const reason = str(body, "reason");
    requireText(reason, 10, "Motif obligatoire.");
    if (!Number.isInteger(amount) || amount === 0) throw invalid("Montant invalide.");
    audit(user, "Argent", `Ajustement de ${amount} F sur le portefeuille de ${w.ownerName} · ${reason}`);
    return replace(db().wallets, (x) => x.id === w.id, { ...w, balance: w.balance + amount, movements: [{ id: newId("wm"), at: new Date().toISOString(), label: `Ajustement : ${reason}`, amount }, ...w.movements] });
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
  // Même contrat que le backend WAMI : /api/admin/affiliates (le versement passe par les retraits).
  route("GET", `${A}/affiliates`, "affiliate", () =>
    db().affiliates.map((a) => {
      const accrued = a.activations * a.ratePerActivation;
      return {
        affiliateId: a.id,
        name: a.name,
        phoneNumber: a.phone,
        socialNetwork: a.kind === "agency" ? "Agence" : "Instagram",
        audienceSize: null,
        status: a.status === "active" ? "ACTIVE" : a.status === "suspended" ? "SUSPENDED" : "CLOSED",
        commissionRate: a.commissionRate ?? null,
        effectiveCommissionRate: a.commissionRate ?? 0.1,
        totalPayable: accrued,
        totalPaid: a.paid,
        outstandingPayable: Math.max(0, accrued - a.paid),
        codes: [{ code: a.code, currentUsages: a.activations, isCurrentlyUsable: a.status === "active" }],
      };
    }),
  ),
  ...(["suspend", "reactivate", "close", "reopen"] as const).map((action) =>
    route("POST", `${A}/affiliates/:id/${action}`, "affiliate", ({ params, body, user }) => {
      const a = find(db().affiliates, (x) => x.id === params.id);
      if (action === "suspend" && body.mode !== "PAUSE" && body.mode !== "SANCTION") throw invalid("mode doit valoir 'PAUSE' ou 'SANCTION'");
      if ((action === "close" || action === "reopen" || (action === "suspend" && body.mode === "SANCTION")) && !str(body, "reason").trim()) throw invalid("reason est obligatoire");
      const status = action === "suspend" ? "suspended" : action === "close" ? "closed" : "active";
      audit(user, "Argent", `Affilié ${a.name} : ${action}`);
      replace(db().affiliates, (x) => x.id === a.id, { ...a, status });
      return { affiliateId: a.id, status: status.toUpperCase() };
    }),
  ),
  // Route absente du backend (faux backend) : versement direct.
  route("POST", `${A}/affiliates/:id/payouts`, "affiliate", ({ params, body, user }) => {
    const a = find(db().affiliates, (x) => x.id === params.id, "Route absente du backend : le versement ne marche que sur les affiliés fictifs.");
    const amount = num(body, "amount");
    if (!(amount > 0)) throw invalid("Montant invalide.");
    audit(user, "Argent", `A versé ${amount} F à ${a.name}`);
    return replace(db().affiliates, (x) => x.id === a.id, { ...a, paid: a.paid + amount });
  }),
  route("PATCH", `${A}/affiliates/:id/commission-rate`, "affiliate", ({ params, body, user }) => {
    const a = find(db().affiliates, (x) => x.id === params.id);
    const rate = typeof body.commissionRate === "number" ? body.commissionRate : null;
    if (rate !== null && (rate < 0 || rate > 1)) throw invalid("commissionRate doit être entre 0 et 1");
    audit(user, "Argent", `Taux de commission de ${a.name} : ${rate === null ? "défaut" : rate}`);
    replace(db().affiliates, (x) => x.id === a.id, { ...a, commissionRate: rate });
    return { affiliateId: a.id, commissionRate: rate };
  }),

  // Même contrat que le backend WAMI : /api/admin/referrals (+ configurations, statistiques).
  route("GET", `${A}/referrals`, "referrals", () =>
    db().referrals.map((r) => ({
      referralId: r.id,
      referrerId: r.referrerName,
      referredUserId: r.refereeName,
      referralCode: `REF-${r.id}`,
      referralType: "PASSENGER",
      status: r.status === "pending" ? "PENDING" : r.status === "rewarded" ? "VALIDATED" : "EXPIRED",
      referrerReward: r.status === "rewarded" ? db().referralProgram.referrerReward : 0,
      referredReward: r.status === "rewarded" ? db().referralProgram.refereeReward : 0,
      validatedAt: r.status === "rewarded" ? r.createdAt : null,
      createdAt: r.createdAt,
    })),
  ),
  // Routes absentes du backend (faux backend) : programme simple et blocage.
  route("GET", `${A}/referrals/program`, "referrals", () => db().referralProgram),
  route("PUT", `${A}/referrals/program`, "referrals", ({ body, user }) => {
    db().referralProgram = body as unknown as ReferralProgram;
    audit(user, "Argent", "A modifié le programme de parrainage");
    return db().referralProgram;
  }),
  route("POST", `${A}/referrals/:id/flag`, "referrals", ({ params, user }) => {
    const r = find(db().referrals, (x) => x.id === params.id, "Route absente du backend : le blocage ne marche que sur les parrainages fictifs.");
    audit(user, "Argent", `Parrainage ${r.id} bloqué`);
    return replace(db().referrals, (x) => x.id === r.id, { ...r, status: "flagged" });
  }),
  route("GET", `${A}/referrals/stats`, "referrals", () => {
    const rows = db().referrals;
    const rewarded = rows.filter((r) => r.status === "rewarded").length;
    return {
      totalReferrals: rows.length,
      validatedReferrals: rewarded,
      pendingReferrals: rows.filter((r) => r.status === "pending").length,
      expiredReferrals: rows.filter((r) => r.status === "flagged").length,
      totalRewardsGiven: rewarded * (db().referralProgram.referrerReward + db().referralProgram.refereeReward),
    };
  }),
  ...(["validate", "expire"] as const).map((action) =>
    route("POST", `${A}/referrals/:id/${action}`, "referrals", ({ params, user }) => {
      const r = find(db().referrals, (x) => x.id === params.id);
      if (r.status !== "pending") throw invalid("Referral is not pending");
      audit(user, "Argent", `Parrainage ${r.id} : ${action}`);
      replace(db().referrals, (x) => x.id === r.id, { ...r, status: action === "validate" ? "rewarded" : "flagged" });
      return { referralId: r.id, status: action === "validate" ? "VALIDATED" : "EXPIRED" };
    }),
  ),
  route("GET", `${A}/referrals/config`, "referrals", () => referralConfigs),
  ...(["activate", "deactivate"] as const).map((action) =>
    route("POST", `${A}/referrals/config/:id/${action}`, "referrals", ({ params, user }) => {
      const c = find(referralConfigs, (x) => x.id === params.id);
      audit(user, "Argent", `Configuration de parrainage « ${c.name} » : ${action}`);
      for (const x of referralConfigs) x.isActive = action === "activate" ? x.id === c.id : x.isActive && x.id !== c.id;
      return { id: c.id, isActive: c.isActive };
    }),
  ),
  route("DELETE", `${A}/referrals/config/:id`, "referrals", ({ params, user }) => {
    const c = find(referralConfigs, (x) => x.id === params.id);
    if (c.isActive) throw invalid("Cannot delete an active configuration");
    referralConfigs.splice(referralConfigs.indexOf(c), 1);
    audit(user, "Argent", `Configuration de parrainage « ${c.name} » supprimée`);
    return { id: c.id };
  }),

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
