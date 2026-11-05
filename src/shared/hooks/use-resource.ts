"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AppError, Result } from "@/shared/lib/result";

export type ResourceState<T> =
  | { status: "loading"; data?: T; error?: undefined }
  | { status: "ready"; data: T; error?: undefined }
  | { status: "error"; data?: T; error: AppError };

/**
 * Charge une donnée via un cas d'usage et expose rechargement et mise à jour locale.
 * `key` : change quand les paramètres changent (filtre, onglet…) → nouveau chargement.
 */
export function useResource<T>(loader: () => Promise<Result<T>>, key: string) {
  const [state, setState] = useState<ResourceState<T>>({ status: "loading" });
  const [version, setVersion] = useState(0);
  const loaderRef = useRef(loader);

  useEffect(() => {
    loaderRef.current = loader;
  });

  useEffect(() => {
    let active = true;
    loaderRef.current().then((r) => {
      if (!active) return;
      setState((prev) => (r.ok ? { status: "ready", data: r.value } : { status: "error", data: prev.data, error: r.error }));
    });
    return () => {
      active = false;
    };
  }, [key, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  /** Mise à jour optimiste ou après une action réussie. */
  const mutate = useCallback((change: (data: T) => T) => {
    setState((prev) => (prev.data === undefined ? prev : { status: "ready", data: change(prev.data) }));
  }, []);

  return { ...state, reload, mutate };
}
