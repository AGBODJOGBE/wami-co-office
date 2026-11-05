/**
 * Tous les endpoints du backend WAMI consommés par le back-office.
 *
 * Le navigateur les appelle via `/api` + route (voir `shared/lib/http.ts`) ;
 * `app/api/v1/[...path]/route.ts` les relaie au backend (`WAMI_API_URL`)
 * ou, sans backend, aux données fictives de `app/api/_proxy/mock`.
 *
 * Les routes marquées « réel » existent dans le backend `wami-co` (voir `app/api/_proxy/backend/declared.ts`) ;
 * les autres sont servies par le faux backend.
 */
const A = "/v1/admin";

export const API = {
  dashboard: {
    overview: `${A}/dashboard`,
  },
  search: {
    query: `${A}/search`,
  },
  liveOps: {
    missions: `${A}/live/missions`,
    acknowledgeSos: (id: string) => `${A}/live/missions/${id}/sos/ack`,
    reassign: (id: string) => `${A}/live/missions/${id}/reassign`,
    cancel: (id: string) => `${A}/live/missions/${id}/cancel`,
    incidents: `${A}/incidents`,
    resolveIncident: (id: string) => `${A}/incidents/${id}/resolve`,
  },
  vtc: {
    categories: `${A}/vtc/categories`,
    category: (key: string) => `${A}/vtc/categories/${key}`,
  },
  rides: {
    list: `${A}/rides`,
    cancel: (id: string) => `${A}/rides/${id}/cancel`,
  },
  delivery: {
    list: `${A}/deliveries`,
    cancel: (id: string) => `${A}/deliveries/${id}/cancel`,
  },
  deliveryB2b: {
    accounts: `${A}/b2b/accounts`,
    account: (id: string) => `${A}/b2b/accounts/${id}`,
    invoices: (id: string) => `${A}/b2b/accounts/${id}/invoices`,
  },
  rounds: {
    list: `${A}/rounds`,
    assign: (id: string) => `${A}/rounds/${id}/assign`,
    couriers: `${A}/rounds/available-couriers`,
  },
  parcelTypes: {
    list: `${A}/parcel-types`,
    item: (code: string) => `${A}/parcel-types/${code}`,
  },
  drivers: {
    list: `${A}/drivers`,
    suspend: (id: string) => `${A}/drivers/${id}/suspend`,
    reactivate: (id: string) => `${A}/drivers/${id}/reactivate`,
  },
  vehicles: {
    list: `${A}/vehicles`,
    assign: (id: string) => `${A}/vehicles/${id}/assign`,
  },
  contracts: {
    list: `${A}/lease-contracts`,
    payments: (id: string) => `${A}/lease-contracts/${id}/payments`,
  },
  documents: {
    dossiers: `${A}/verifications`,
    review: (dossierId: string, docId: string) => `${A}/verifications/${dossierId}/documents/${docId}`,
    activate: (dossierId: string) => `${A}/verifications/${dossierId}/activate`,
  },
  driverBonus: {
    challenges: `${A}/driver-bonus/challenges`,
    challenge: (id: string) => `${A}/driver-bonus/challenges/${id}`,
  },
  establishments: {
    list: `${A}/establishments`,
    commission: (id: string) => `${A}/establishments/${id}/commission`,
    status: (id: string) => `${A}/establishments/${id}/status`,
  },
  support: {
    tickets: `${A}/support/tickets`,
    reply: (id: string) => `${A}/support/tickets/${id}/messages`,
    refund: (id: string) => `${A}/support/tickets/${id}/refund`,
    close: (id: string) => `${A}/support/tickets/${id}/close`,
  },
  wallet: {
    list: `${A}/wallets`,
    adjust: (id: string) => `${A}/wallets/${id}/adjustments`,
  },
  finance: {
    summary: `${A}/finance/summary`,
    batch: `${A}/finance/payout-batches/current`,
    submitBatch: `${A}/finance/payout-batches/current/submit`,
    approveBatch: `${A}/finance/payout-batches/current/approve`,
  },
  promoCodes: {
    list: `${A}/promo-codes`,
    item: (code: string) => `${A}/promo-codes/${code}`,
  },
  affiliate: {
    list: `${A}/affiliates`,
    pay: (id: string) => `${A}/affiliates/${id}/payouts`,
  },
  referrals: {
    program: `${A}/referrals/program`,
    list: `${A}/referrals`,
    flag: (id: string) => `${A}/referrals/${id}/flag`,
  },
  notifications: {
    campaigns: `${A}/notifications/campaigns`,
  },
  pricing: {
    zones: `${A}/pricing/zones`,
    tariffs: (zoneId: string) => `${A}/pricing/zones/${zoneId}/tariffs`,
    tariff: (zoneId: string, service: string) => `${A}/pricing/zones/${zoneId}/tariffs/${service}`,
    commissions: `${A}/pricing/commissions`,
  },
  rbac: {
    members: `${A}/rbac/members`,
    member: (id: string) => `${A}/rbac/members/${id}`,
    audit: `${A}/rbac/audit-log`,
  },
  settings: {
    platform: `${A}/settings`,
  },
} as const;
