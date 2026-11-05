import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { B2cDelivery, B2cStatus } from "../domain/b2c-delivery";
import type { B2cDeliveriesRepository } from "../domain/b2c-deliveries.repository";

/** Élément de `GET /api/admin/delivery` (backend wami-co) : champs utilisés. */
export interface BackendB2c {
  id: string;
  orderNumber: string;
  status: string;
  vehicleType: string;
  paymentMethod: string;
  passenger: { name: string; phone: string | null };
  driver: { name: string; phone: string | null } | null;
  pickup: { address: string };
  dropoff: { address: string };
  parcel: { type: string; description: string };
  recipient: { name: string; phone: string };
  pricing: { estimatedPrice: number; finalPrice: number | null; platformCommission: number | null; driverPayout: number | null };
  pickupPhoto: string | null;
  deliveryPhoto: string | null;
  cancelReason: string | null;
  cancelledBy: string | null;
  scheduledAt: string | null;
  createdAt: string;
}

const STATUS: Record<string, B2cStatus> = {
  PENDING_MATCH: "searching",
  DRIVER_ASSIGNED: "assigned",
  PICKUP_IN_PROGRESS: "pickup",
  PICKUP_FAILED: "pickupFailed",
  IN_TRANSIT: "transit",
  DELIVERY_IN_PROGRESS: "delivering",
  DELIVERY_FAILED: "deliveryFailed",
  RETURN_IN_PROGRESS: "returning",
  RETURNED: "returned",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

export const toDelivery = (d: BackendB2c): B2cDelivery => ({
  id: d.id,
  number: d.orderNumber,
  status: STATUS[d.status] ?? "searching",
  vehicleType: d.vehicleType,
  payment: d.paymentMethod,
  sender: d.passenger.name,
  senderPhone: d.passenger.phone,
  driver: d.driver?.name ?? null,
  driverPhone: d.driver?.phone ?? null,
  from: d.pickup.address,
  to: d.dropoff.address,
  recipient: d.recipient.name,
  recipientPhone: d.recipient.phone,
  parcel: `${d.parcel.type} · ${d.parcel.description}`,
  estimatedPrice: d.pricing.estimatedPrice,
  finalPrice: d.pricing.finalPrice,
  commission: d.pricing.platformCommission,
  driverPayout: d.pricing.driverPayout,
  pickupPhoto: d.pickupPhoto,
  deliveryPhoto: d.deliveryPhoto,
  cancelReason: d.cancelReason,
  cancelledBy: d.cancelledBy,
  scheduledAt: d.scheduledAt,
  createdAt: d.createdAt,
});

export class HttpB2cDeliveriesRepository implements B2cDeliveriesRepository {
  async list() {
    const rows = await http.get<BackendB2c[]>(API.deliveryB2c.list);
    return rows.map(toDelivery);
  }
  async cancel(id: string, reason: string) {
    await http.delete(API.deliveryB2c.order(id), { reason });
  }
}
