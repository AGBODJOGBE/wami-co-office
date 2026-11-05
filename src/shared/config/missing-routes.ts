/**
 * Routes que le back-office appelle mais que le backend WAMI (`wami-co`) n'expose pas encore.
 * Ces écrans (ou ces parties d'écran) tournent sur le faux backend (`app/api/_proxy/mock`),
 * avec des données fictives. Chaque entrée est la route à implémenter côté backend pour
 * que l'écran passe sur des données réelles ; quand c'est fait, il suffit de la déclarer
 * dans `app/api/_proxy/backend/declared.ts` et de la retirer d'ici.
 *
 * Le préfixe réel est `/api/admin` (le navigateur appelle `/api/v1/admin/...`).
 */
export interface MissingRoute {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  purpose: string;
}

const r = (method: MissingRoute["method"], path: string, purpose: string): MissingRoute => ({ method, path: `/api/admin${path}`, purpose });

export const MISSING_ROUTES = {
  dashboard: [r("GET", "/dashboard", "Indicateurs du tableau de bord (courses, livraisons, revenus, incidents)")],
  search: [r("GET", "/search?q=", "Recherche globale (courses, chauffeurs, clients, tickets…), résultats groupés")],
  liveOps: [
    r("GET", "/live/missions", "Missions en cours avec position, retard et priorité"),
    r("POST", "/live/missions/:id/sos/ack", "Prendre en charge une alerte SOS"),
    r("POST", "/live/missions/:id/reassign", "Réassigner une mission avant la prise en charge"),
    r("POST", "/live/missions/:id/cancel", "Annuler une mission en direct, avec motif"),
    r("GET", "/incidents", "Incidents ouverts"),
    r("POST", "/incidents/:id/resolve", "Résoudre un incident"),
  ],
  vtc: [r("GET", "/vtc/categories", "Offres VTC (catégories)"), r("PATCH", "/vtc/categories/:key", "Activer ou désactiver une offre")],
  delivery: [r("GET", "/deliveries", "Livraisons (colis, repas), toutes filières"), r("POST", "/deliveries/:id/cancel", "Annuler une livraison, avec motif")],
  deliveryB2b: [
    r("GET", "/b2b/accounts", "Comptes entreprises"),
    r("PATCH", "/b2b/accounts/:id", "Modifier le plafond de crédit"),
    r("GET", "/b2b/accounts/:id/invoices", "Factures d'un compte"),
  ],
  rounds: [r("GET", "/rounds", "Tournées de livraison"), r("GET", "/rounds/available-couriers", "Livreurs disponibles"), r("POST", "/rounds/:id/assign", "Assigner un livreur à une tournée")],
  parcelTypes: [r("GET", "/parcel-types", "Types de colis"), r("POST", "/parcel-types", "Créer un type de colis"), r("PUT", "/parcel-types/:code", "Modifier un type de colis")],
  documents: [
    r("GET", "/verifications", "Dossiers de vérification des partenaires"),
    r("POST", "/verifications/:dossierId/documents/:docId", "Valider ou refuser une pièce"),
    r("POST", "/verifications/:dossierId/activate", "Activer le partenaire quand tout est validé"),
  ],
  vehicles: [r("GET", "/vehicles", "Flotte (véhicules WAMI-CO et partenaires), assurance et visite"), r("POST", "/vehicles/:id/assign", "Affecter ou retirer un véhicule")],
  establishments: [
    r("GET", "/establishments", "Établissements (WAMI Business)"),
    r("PUT", "/establishments/:id/commission", "Modifier la commission"),
    r("POST", "/establishments/:id/status", "Suspendre ou réactiver"),
  ],
  support: [
    r("GET", "/support/tickets", "Tickets et litiges"),
    r("POST", "/support/tickets/:id/messages", "Répondre"),
    r("POST", "/support/tickets/:id/refund", "Rembourser"),
    r("POST", "/support/tickets/:id/close", "Clôturer"),
  ],
  finance: [
    r("GET", "/finance/summary", "Synthèse financière"),
    r("GET", "/finance/payout-batches/current", "Lot de versement en cours"),
    r("POST", "/finance/payout-batches/current/submit", "Préparer le lot"),
    r("POST", "/finance/payout-batches/current/approve", "Valider le lot (double validation)"),
  ],
  notifications: [r("GET", "/notifications/campaigns", "Campagnes push / SMS"), r("POST", "/notifications/campaigns", "Envoyer ou programmer une campagne")],
  pricingZones: [
    r("GET", "/pricing/zones", "Zones avec polygone, couleur et statut (le backend n'a que code, nom et type)"),
    r("GET", "/pricing/zones/:zoneId/tariffs", "Tarifs d'une zone par service"),
    r("PUT", "/pricing/zones/:zoneId/tariffs/:service", "Modifier un tarif"),
    r("GET", "/pricing/commissions", "Commissions par activité"),
  ],
  rbac: [r("GET", "/rbac/audit-log", "Journal d'audit des actions des agents")],
  settings: [r("GET", "/settings", "Paramètres de la plateforme"), r("PUT", "/settings", "Modifier les paramètres")],
  walletAdjust: [r("POST", "/wallets/:id/adjustments", "Ajustement manuel d'un portefeuille (crédit ou débit motivé)")],
  affiliatePay: [r("POST", "/affiliates/:id/payouts", "Versement direct d'une commission à un affilié")],
  referralProgram: [
    r("GET", "/referrals/program", "Programme de parrainage simple (récompenses, missions requises)"),
    r("PUT", "/referrals/program", "Modifier le programme"),
    r("POST", "/referrals/:id/flag", "Bloquer un parrainage suspect"),
  ],
  driverChallenges: [
    r("GET", "/driver-bonus/challenges", "Défis « X missions = Y F » par zone et période"),
    r("POST", "/driver-bonus/challenges", "Créer un défi"),
    r("PATCH", "/driver-bonus/challenges/:id", "Archiver un défi"),
  ],
} satisfies Record<string, MissingRoute[]>;

export type MissingArea = keyof typeof MISSING_ROUTES;
