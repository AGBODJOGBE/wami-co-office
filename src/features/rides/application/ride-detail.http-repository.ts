import { API } from "@/shared/config/api-routes";
import { ApiError } from "@/shared/lib/result";
import { http } from "@/shared/lib/http";
import { flatten, type KeyValue, type MatchingView, type RideDetail, type Section, type SettlementView, type TrackView } from "../domain/ride-detail";
import type { RideDetailRepository } from "../domain/ride-detail.repository";

type Raw<T> = ({ available: true } & T) | { available: false; reason: string };

export interface BackendMatching {
  available: true;
  summary: {
    solicitedCount: number;
    ignoredCount: number;
    rejectedCount?: number;
    finalReason?: string;
    cycles?: Array<{ at: string; trigger: string; vehicleType: string; outcome: string; steps: Array<{ radiusKm: number; eligible: number }> }>;
    milestones?: Array<{ at: string; code: string; detail?: string }>;
  } & Record<string, unknown>;
}

export function toMatching(r: BackendMatching): Section<MatchingView> {
  const { cycles = [], milestones = [], ...rest } = r.summary;
  return {
    available: true,
    cycles: cycles.map((c) => ({ at: c.at, trigger: c.trigger, vehicleType: c.vehicleType, outcome: c.outcome, radii: c.steps.map((s) => `${s.radiusKm} km (${s.eligible})`).join(" → ") })),
    milestones: milestones.map((m) => ({ at: m.at, code: m.code, detail: m.detail ?? null })),
    facts: flatten(rest).filter((f) => f.key !== "Version" && f.key !== "version"),
  };
}

export interface BackendTrack {
  trackAvailable: boolean;
  reason?: string;
  pointCount?: number;
  decimatedPointCount?: number;
  truncated?: boolean;
  geojson?: { features: Array<{ properties: { rideStatus: string; startTimestamp: string; endTimestamp: string; pointCount: number } }> };
}

export function toTrack(r: BackendTrack): Section<TrackView> {
  if (!r.trackAvailable) return { available: false, reason: r.reason ?? "NOT_RECORDED" };
  return {
    available: true,
    pointCount: r.pointCount ?? 0,
    sampledCount: r.decimatedPointCount ?? 0,
    truncated: r.truncated ?? false,
    segments: (r.geojson?.features ?? []).map((f) => ({ status: f.properties.rideStatus, from: f.properties.startTimestamp, to: f.properties.endTimestamp, points: f.properties.pointCount })),
  };
}

export interface BackendSettlement {
  rideNumber: string;
  status: string;
  guarantee: { amount: number; ratePct: number | null; holdStatus: string; heldAt: string; resolvedAt: string | null } | null;
  movements: Array<{ transactionId: string; type: string; direction: string; amount: number; description: string; createdAt: string; isMarker: boolean }>;
}

export function toSettlement(r: BackendSettlement): SettlementView {
  const facts: KeyValue[] = r.guarantee
    ? [
        { key: "Garantie gelée", value: `${r.guarantee.amount.toLocaleString("fr-FR")} F${r.guarantee.ratePct !== null ? ` (${r.guarantee.ratePct} %)` : ""}` },
        { key: "État du gel", value: r.guarantee.holdStatus },
        { key: "Gelée le", value: r.guarantee.heldAt },
        { key: "Résolue le", value: r.guarantee.resolvedAt ?? "—" },
      ]
    : [];
  return { facts, movements: r.movements.map((m) => ({ id: m.transactionId, at: m.createdAt, label: `${m.type} · ${m.description}`, direction: m.direction, amount: m.amount, isMarker: m.isMarker })) };
}

export const toTelemetry = (raw: Raw<{ summary: unknown }>): Section<{ facts: KeyValue[] }> => (raw.available ? { available: true, facts: flatten(raw.summary) } : raw);

export class HttpRideDetailRepository implements RideDetailRepository {
  async detail(rideId: string): Promise<RideDetail> {
    const [telemetry, matching, track] = await Promise.all([
      http.get<Raw<{ summary: unknown }>>(API.rides.telemetry(rideId)),
      http.get<BackendMatching | { available: false; reason: string }>(API.rides.matching(rideId)),
      http.get<BackendTrack>(API.rides.track(rideId), { every: 10 }),
    ]);
    return {
      telemetry: toTelemetry(telemetry),
      matching: matching.available ? toMatching(matching) : matching,
      track: toTrack(track),
    };
  }
  async settlement(rideId: string) {
    try {
      return toSettlement(await http.get<BackendSettlement>(API.rides.guaranteeSettlement(rideId)));
    } catch (e) {
      // 404 : course sans garantie (course immédiate).
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  }
}
