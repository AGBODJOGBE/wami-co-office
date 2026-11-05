"use client";

import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Polygon, TileLayer, Tooltip } from "react-leaflet";
import { COTONOU, type LatLng, type MapArea, type MapPoint } from "./geo";

/**
 * Carte Leaflet. Chargée uniquement côté navigateur (voir `wami-map.tsx`).
 * Fond OpenStreetMap : convient au développement ; en production, prendre un
 * fournisseur de tuiles avec contrat (Mapbox, MapTiler…) — à valider.
 */
export default function LeafletMap({
  points = [],
  areas = [],
  center = COTONOU,
  zoom = 13,
  onPointClick,
}: {
  points?: MapPoint[];
  areas?: MapArea[];
  center?: LatLng;
  zoom?: number;
  onPointClick?: (id: string) => void;
}) {
  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom className="h-full w-full" attributionControl>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {areas.map((a) => (
        <Polygon key={a.id} positions={a.polygon} pathOptions={{ color: a.color, weight: 2, fillOpacity: 0.15 }}>
          <Tooltip sticky>{a.label}</Tooltip>
        </Polygon>
      ))}
      {points.map((p) => (
        <CircleMarker
          key={p.id}
          center={p.position}
          radius={p.emphasis ? 11 : 7}
          pathOptions={{ color: "#ffffff", weight: 2, fillColor: p.color, fillOpacity: 1 }}
          eventHandlers={onPointClick ? { click: () => onPointClick(p.id) } : undefined}
        >
          <Tooltip>{p.label}</Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
