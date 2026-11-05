import "server-only";
import { declareReal } from "./routes";

// Routes réellement exposées par le backend WAMI, par module. Complété module par module.
// Auth : gérée par /api/auth/* (login téléphone + mot de passe), pas par le proxy.
declareReal("GET", "/v1/admin/me/permissions");

// Chauffeurs
declareReal("GET", "/v1/admin/drivers");
declareReal("PATCH", "/v1/admin/drivers/:id/suspend");
declareReal("PATCH", "/v1/admin/drivers/:id/reactivate");

// Courses
declareReal("GET", "/v1/admin/rides");
declareReal("GET", "/v1/admin/rides/:id");
declareReal("PATCH", "/v1/admin/rides/:id/status");

// Portefeuilles
declareReal("GET", "/v1/admin/wallets");
declareReal("GET", "/v1/admin/wallets/:id");
declareReal("PATCH", "/v1/admin/wallets/:id/withdrawals/block");
declareReal("PATCH", "/v1/admin/wallets/:id/withdrawals/unblock");
declareReal("GET", "/v1/admin/transactions");

// Contrats de location-vente
declareReal("GET", "/v1/admin/contracts");
declareReal("GET", "/v1/admin/contracts/:id");
declareReal("GET", "/v1/admin/contracts/:id/installments");
declareReal("POST", "/v1/admin/contracts/:id/manual-payment");
declareReal("POST", "/v1/admin/contracts/:id/suspend");
declareReal("POST", "/v1/admin/contracts/:id/resume");
declareReal("POST", "/v1/admin/contracts/:id/break");

// Codes promo
declareReal("GET", "/v1/admin/promo-codes");
declareReal("POST", "/v1/admin/promo-codes");
declareReal("PATCH", "/v1/admin/promo-codes/:id/toggle");
declareReal("PATCH", "/v1/admin/promo-codes/:id/affiliate");
declareReal("PATCH", "/v1/admin/promo-codes/:id/margin-residual");

// Affiliation (la route /:id/payouts du front n'existe pas : le versement passe par les retraits)
declareReal("GET", "/v1/admin/affiliates");
declareReal("GET", "/v1/admin/affiliates/:id");
declareReal("PATCH", "/v1/admin/affiliates/:id/commission-rate");
declareReal("POST", "/v1/admin/affiliates/:id/suspend");
declareReal("POST", "/v1/admin/affiliates/:id/reactivate");
declareReal("POST", "/v1/admin/affiliates/:id/close");
declareReal("POST", "/v1/admin/affiliates/:id/reopen");

// Parrainage
declareReal("GET", "/v1/admin/referrals");
declareReal("GET", "/v1/admin/referrals/stats");
declareReal("POST", "/v1/admin/referrals/:id/validate");
declareReal("POST", "/v1/admin/referrals/:id/expire");
declareReal("GET", "/v1/admin/referrals/config");
declareReal("POST", "/v1/admin/referrals/config/:id/activate");
declareReal("POST", "/v1/admin/referrals/config/:id/deactivate");
declareReal("DELETE", "/v1/admin/referrals/config/:id");

// Primes chauffeurs
for (const kind of ["config", "activity-config", "quality-config"]) {
  declareReal("GET", `/v1/admin/driver-bonus/${kind}`);
  declareReal("POST", `/v1/admin/driver-bonus/${kind}/:id/activate`);
  declareReal("POST", `/v1/admin/driver-bonus/${kind}/:id/deactivate`);
  declareReal("DELETE", `/v1/admin/driver-bonus/${kind}/:id`);
}
declareReal("GET", "/v1/admin/driver-bonus/awards");
declareReal("GET", "/v1/admin/driver-bonus/activity-ledger");
declareReal("GET", "/v1/admin/driver-bonus/activity-payouts");
declareReal("GET", "/v1/admin/driver-bonus/quality-ledger");
declareReal("GET", "/v1/admin/driver-bonus/run-config");
declareReal("PUT", "/v1/admin/driver-bonus/run-config");

// Administrateurs, rôles et permissions
declareReal("GET", "/v1/admin/admins");
declareReal("POST", "/v1/admin/register");
declareReal("PATCH", "/v1/admin/admins/:id/role");
declareReal("PATCH", "/v1/admin/admins/:id/deactivate");
declareReal("PATCH", "/v1/admin/admins/:id/reactivate");
declareReal("GET", "/v1/admin/roles");
declareReal("GET", "/v1/admin/permissions");

// Retraits
declareReal("GET", "/v1/admin/withdrawals");
declareReal("PATCH", "/v1/admin/withdrawals/:id/approve");
declareReal("PATCH", "/v1/admin/withdrawals/:id/reject");

// Dotations de portefeuille
declareReal("GET", "/v1/admin/wallet/grants");
declareReal("GET", "/v1/admin/wallet/grants/:id");
declareReal("POST", "/v1/admin/wallet/grants");
declareReal("POST", "/v1/admin/wallet/grants/preview");
declareReal("POST", "/v1/admin/wallet/grants/:id/approve");
declareReal("POST", "/v1/admin/wallet/grants/:id/reject");
declareReal("POST", "/v1/admin/wallet/grants/:id/cancel");
declareReal("POST", "/v1/admin/wallet/grants/:id/retry-failed");

// Revenus, créances, dettes de commission, règles des portefeuilles, bonus de bienvenue
declareReal("GET", "/v1/admin/platform/revenue");
declareReal("GET", "/v1/admin/finance/receivables-overview");
declareReal("GET", "/v1/admin/drivers/commission-debts");
declareReal("GET", "/v1/admin/drivers/:id/commission-debts");
declareReal("GET", "/v1/admin/wallet-config");
declareReal("PATCH", "/v1/admin/wallet-config");
declareReal("GET", "/v1/admin/driver-welcome-bonus");
declareReal("PATCH", "/v1/admin/driver-welcome-bonus");

// Courses programmées : affectation manuelle
declareReal("GET", "/v1/admin/scheduled-rides/manual-assignment");
declareReal("POST", "/v1/admin/scheduled-rides/:id/manual-assignment");

// Utilisateurs et paiements
declareReal("GET", "/v1/admin/users");
declareReal("GET", "/v1/admin/payments/intents");

// Chauffeurs : candidatures, en ligne, type d'activité, sessions
declareReal("GET", "/v1/admin/drivers/pending");
declareReal("PATCH", "/v1/admin/drivers/:id/approve");
declareReal("GET", "/v1/admin/drivers/online");
declareReal("PATCH", "/v1/admin/drivers/:id/driver-type");
declareReal("GET", "/v1/admin/drivers/:id/sessions");

// Détail d'une course : matching, télémétrie, trace GPS, règlement de garantie
declareReal("GET", "/v1/admin/rides/:id/telemetry");
declareReal("GET", "/v1/admin/rides/:id/matching");
declareReal("GET", "/v1/admin/rides/:id/track");
declareReal("GET", "/v1/admin/rides/:id/guarantee-settlement");

// Profils tarifaires et zones de tarification (la carte des zones, /pricing/zone-areas, reste en mock)
declareReal("GET", "/v1/admin/pricing/profiles");
declareReal("GET", "/v1/admin/pricing/profiles/:id");
declareReal("POST", "/v1/admin/pricing/profiles/:id/activate");
declareReal("POST", "/v1/admin/pricing/profiles/:id/deactivate");
declareReal("DELETE", "/v1/admin/pricing/profiles/:id");
declareReal("GET", "/v1/admin/pricing/zones");
declareReal("POST", "/v1/admin/pricing/zones");
declareReal("PATCH", "/v1/admin/pricing/zones/:id");
declareReal("DELETE", "/v1/admin/pricing/zones/:id");

// Parrainage : création et édition des configurations
declareReal("POST", "/v1/admin/referrals/config");
declareReal("PUT", "/v1/admin/referrals/config/:id");

// Primes chauffeurs : création et édition des configurations
for (const kind of ["config", "activity-config", "quality-config"]) {
  declareReal("POST", `/v1/admin/driver-bonus/${kind}`);
  declareReal("PUT", `/v1/admin/driver-bonus/${kind}/:id`);
}
