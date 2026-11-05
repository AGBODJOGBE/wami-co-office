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
  scheduledRides: {
    list: `${A}/scheduled-rides/manual-assignment`,
    assign: (rideId: string) => `${A}/scheduled-rides/${rideId}/manual-assignment`,
  },
  vtc: {
    categories: `${A}/vtc/categories`,
    category: (key: string) => `${A}/vtc/categories/${key}`,
  },
  rides: {
    list: `${A}/rides`,
    detail: (id: string) => `${A}/rides/${id}`,
    status: (id: string) => `${A}/rides/${id}/status`,
    telemetry: (id: string) => `${A}/rides/${id}/telemetry`,
    matching: (id: string) => `${A}/rides/${id}/matching`,
    track: (id: string) => `${A}/rides/${id}/track`,
    guaranteeSettlement: (id: string) => `${A}/rides/${id}/guarantee-settlement`,
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
    list: `${A}/contracts`,
    detail: (id: string) => `${A}/contracts/${id}`,
    installments: (id: string) => `${A}/contracts/${id}/installments`,
    manualPayment: (id: string) => `${A}/contracts/${id}/manual-payment`,
    suspend: (id: string) => `${A}/contracts/${id}/suspend`,
    resume: (id: string) => `${A}/contracts/${id}/resume`,
    break: (id: string) => `${A}/contracts/${id}/break`,
    unblockDriver: (driverId: string) => `${A}/contracts/drivers/${driverId}/unblock`,
    repaymentMode: (id: string) => `${A}/contracts/${id}/repayment-mode`,
    revenueShareRate: (id: string) => `${A}/contracts/${id}/revenue-share-rate`,
    withholdings: (id: string) => `${A}/contracts/${id}/revenue-share/withholdings`,
    kpis: `${A}/contracts/dashboard/kpis`,
    auditLogs: `${A}/contracts/audit-logs`,
    revenueShareAlerts: `${A}/contracts/revenue-share/alerts`,
  },
  documents: {
    dossiers: `${A}/verifications`,
    review: (dossierId: string, docId: string) => `${A}/verifications/${dossierId}/documents/${docId}`,
    activate: (dossierId: string) => `${A}/verifications/${dossierId}/activate`,
  },
  driverBonus: {
    tierConfigs: `${A}/driver-bonus/config`,
    activityConfigs: `${A}/driver-bonus/activity-config`,
    qualityConfigs: `${A}/driver-bonus/quality-config`,
    awards: `${A}/driver-bonus/awards`,
    activityLedger: `${A}/driver-bonus/activity-ledger`,
    activityPayouts: `${A}/driver-bonus/activity-payouts`,
    qualityLedger: `${A}/driver-bonus/quality-ledger`,
    runConfig: `${A}/driver-bonus/run-config`,
    welcomeBonus: `${A}/driver-welcome-bonus`,
    // Absentes du backend (faux backend) : voir missing-routes.ts
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
    detail: (id: string) => `${A}/wallets/${id}`,
    // Absente du backend (faux backend) : voir missing-routes.ts
    adjust: (id: string) => `${A}/wallets/${id}/adjustments`,
    blockWithdrawals: (id: string) => `${A}/wallets/${id}/withdrawals/block`,
    unblockWithdrawals: (id: string) => `${A}/wallets/${id}/withdrawals/unblock`,
    transactions: `${A}/transactions`,
    withdrawals: `${A}/withdrawals`,
    approveWithdrawal: (id: string) => `${A}/withdrawals/${id}/approve`,
    rejectWithdrawal: (id: string) => `${A}/withdrawals/${id}/reject`,
    platformRevenue: `${A}/platform/revenue`,
    receivables: `${A}/finance/receivables-overview`,
    commissionDebts: `${A}/drivers/commission-debts`,
    driverCommissionDebts: (driverId: string) => `${A}/drivers/${driverId}/commission-debts`,
    config: `${A}/wallet-config`,
    grants: `${A}/wallet/grants`,
    grantsPreview: `${A}/wallet/grants/preview`,
    grant: (id: string) => `${A}/wallet/grants/${id}`,
    approveGrant: (id: string) => `${A}/wallet/grants/${id}/approve`,
    rejectGrant: (id: string) => `${A}/wallet/grants/${id}/reject`,
    cancelGrant: (id: string) => `${A}/wallet/grants/${id}/cancel`,
    retryGrant: (id: string) => `${A}/wallet/grants/${id}/retry-failed`,
  },
  finance: {
    summary: `${A}/finance/summary`,
    batch: `${A}/finance/payout-batches/current`,
    submitBatch: `${A}/finance/payout-batches/current/submit`,
    approveBatch: `${A}/finance/payout-batches/current/approve`,
  },
  promoCodes: {
    list: `${A}/promo-codes`,
    toggle: (id: string) => `${A}/promo-codes/${id}/toggle`,
    affiliate: (id: string) => `${A}/promo-codes/${id}/affiliate`,
    marginResidual: (id: string) => `${A}/promo-codes/${id}/margin-residual`,
  },
  affiliate: {
    list: `${A}/affiliates`,
    create: `${A}/affiliates`,
    detail: (id: string) => `${A}/affiliates/${id}`,
    config: `${A}/affiliates/config`,
    eligibility: `${A}/affiliates/eligibility`,
    commissionSkips: `${A}/affiliates/commission-skips`,
    commission: (id: string) => `${A}/affiliates/commissions/${id}`,
    holdCommission: (id: string) => `${A}/affiliates/commissions/${id}/hold`,
    releaseCommission: (id: string) => `${A}/affiliates/commissions/${id}/release`,
    cancelCommission: (id: string) => `${A}/affiliates/commissions/${id}/cancel`,
    commissionRate: (id: string) => `${A}/affiliates/${id}/commission-rate`,
    suspend: (id: string) => `${A}/affiliates/${id}/suspend`,
    reactivate: (id: string) => `${A}/affiliates/${id}/reactivate`,
    close: (id: string) => `${A}/affiliates/${id}/close`,
    reopen: (id: string) => `${A}/affiliates/${id}/reopen`,
    // Absente du backend (faux backend) : voir missing-routes.ts
    pay: (id: string) => `${A}/affiliates/${id}/payouts`,
  },
  referrals: {
    list: `${A}/referrals`,
    stats: `${A}/referrals/stats`,
    validate: (id: string) => `${A}/referrals/${id}/validate`,
    expire: (id: string) => `${A}/referrals/${id}/expire`,
    filleuls: `${A}/referrals/filleuls`,
    filleul: (userId: string) => `${A}/referrals/filleuls/${userId}`,
    parrains: `${A}/referrals/parrains`,
    parrain: (userId: string) => `${A}/referrals/parrains/${userId}`,
    configs: `${A}/referrals/config`,
    activeConfig: `${A}/referrals/config/active`,
    config: (id: string) => `${A}/referrals/config/${id}`,
    activateConfig: (id: string) => `${A}/referrals/config/${id}/activate`,
    deactivateConfig: (id: string) => `${A}/referrals/config/${id}/deactivate`,
    // Absentes du backend (faux backend) : voir missing-routes.ts
    program: `${A}/referrals/program`,
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
    members: `${A}/admins`,
    register: `${A}/register`,
    changeRole: (id: string) => `${A}/admins/${id}/role`,
    deactivate: (id: string) => `${A}/admins/${id}/deactivate`,
    reactivate: (id: string) => `${A}/admins/${id}/reactivate`,
    grantPermission: (id: string) => `${A}/admins/${id}/grant-permission`,
    roles: `${A}/roles`,
    role: (id: string) => `${A}/roles/${id}/permissions`,
    permissions: `${A}/permissions`,
    myPermissions: `${A}/me/permissions`,
    // Absente du backend (faux backend) : voir missing-routes.ts
    audit: `${A}/rbac/audit-log`,
  },
  settings: {
    platform: `${A}/settings`,
  },
} as const;
