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
