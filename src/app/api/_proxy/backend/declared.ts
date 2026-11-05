import "server-only";
import { declareReal } from "./routes";

// Routes réellement exposées par le backend WAMI, par module. Complété module par module.
// Auth : gérée par /api/auth/* (login téléphone + mot de passe), pas par le proxy.
declareReal("GET", "/v1/admin/me/permissions");
