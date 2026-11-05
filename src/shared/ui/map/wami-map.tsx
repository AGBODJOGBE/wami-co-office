"use client";

import dynamic from "next/dynamic";

/** Leaflet manipule `window` : la carte n'est jamais rendue côté serveur. */
export const WamiMap = dynamic(() => import("./leaflet-map"), {
  ssr: false,
  loading: () => (
    <div role="status" className="flex h-full min-h-60 items-center justify-center bg-[#E9EBEF] text-sm text-muted">
      Chargement de la carte…
    </div>
  ),
});

export type { LatLng, MapArea, MapPoint } from "./geo";
export { COTONOU } from "./geo";
