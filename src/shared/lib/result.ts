/**
 * Résultat d'un cas d'usage : une valeur, ou une erreur prête à afficher.
 * Les couches application/presentation ne manipulent jamais d'exception brute.
 */
export type AppErrorKind = "validation" | "unavailable" | "forbidden" | "network" | "server" | "unexpected";

export interface AppError {
  kind: AppErrorKind;
  message: string;
  /** Code renvoyé par le backend WAMI, si présent. */
  code?: string;
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: AppError };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });

export const fail = <T = never>(kind: AppErrorKind, message: string, code?: string): Result<T> => ({
  ok: false,
  error: { kind, message, code },
});

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const DEFAULT_MESSAGES: Record<AppErrorKind, string> = {
  validation: "Données invalides.",
  unavailable: "Cet élément n’est plus disponible.",
  forbidden: "Votre rôle ne permet pas cette action.",
  network: "Connexion impossible. Vérifiez votre réseau.",
  server: "Le service WAMI est momentanément indisponible.",
  unexpected: "Une erreur inattendue est survenue.",
};

export function toAppError(e: unknown): AppError {
  if (e instanceof ApiError) {
    const kind: AppErrorKind =
      e.status === 400 || e.status === 422
        ? "validation"
        : e.status === 403
          ? "forbidden"
          : e.status === 404 || e.status === 409
            ? "unavailable"
            : e.status >= 500
              ? "server"
              : "unexpected";
    return { kind, message: e.message || DEFAULT_MESSAGES[kind], code: e.code };
  }
  if (e instanceof TypeError) return { kind: "network", message: DEFAULT_MESSAGES.network };
  return { kind: "unexpected", message: DEFAULT_MESSAGES.unexpected };
}

/** Exécute un appel de repository et convertit les exceptions en Result. */
export async function guard<T>(call: () => Promise<T>): Promise<Result<T>> {
  try {
    return ok(await call());
  } catch (e) {
    return { ok: false, error: toAppError(e) };
  }
}
