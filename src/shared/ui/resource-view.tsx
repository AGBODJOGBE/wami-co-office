"use client";

import type { ReactNode } from "react";
import type { ResourceState } from "@/shared/hooks/use-resource";
import { ErrorState, Loading } from "./primitives";

/** Affiche chargement, erreur ou contenu d'une ressource. */
export function ResourceView<T>({
  state,
  onRetry,
  children,
}: {
  state: ResourceState<T>;
  onRetry: () => void;
  children: (data: T) => ReactNode;
}) {
  if (state.data !== undefined) return <>{children(state.data)}</>;
  if (state.status === "error") return <ErrorState message={state.error.message} onRetry={onRetry} />;
  return <Loading />;
}
