"use client";

import { useCallback, useState } from "react";
import type { Result } from "@/shared/lib/result";
import { useToast } from "@/shared/ui/toast.store";

/**
 * Exécute une action (cas d'usage) : état « en cours », message d'erreur ou de succès.
 * Renvoie la valeur en cas de succès, `undefined` sinon.
 */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const push = useToast((s) => s.push);

  const run = useCallback(
    async <T>(action: () => Promise<Result<T>>, success?: string): Promise<T | undefined> => {
      setBusy(true);
      try {
        const r = await action();
        if (!r.ok) {
          push({ tone: "bad", text: r.error.message });
          return undefined;
        }
        if (success) push({ tone: "ok", text: success });
        return r.value;
      } finally {
        setBusy(false);
      }
    },
    [push],
  );

  return { busy, run };
}
