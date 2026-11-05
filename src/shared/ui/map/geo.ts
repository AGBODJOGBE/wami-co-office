/** Types géographiques partagés par les cartes Leaflet. */
export type LatLng = [number, number];

export interface MapPoint {
  id: string;
  position: LatLng;
  /** Couleur du point (statut). */
  color: string;
  label: string;
  emphasis?: boolean;
}

export interface MapArea {
  id: string;
  polygon: LatLng[];
  color: string;
  label: string;
}

/** Centre de Cotonou. */
export const COTONOU: LatLng = [6.3654, 2.4183];
