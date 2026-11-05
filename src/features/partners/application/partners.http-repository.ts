import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { PendingPartner } from "../domain/partner";
import type { PartnersRepository } from "../domain/partners.repository";

/** Élément de `GET /api/admin/partners/pending` (backend wami-co). */
export interface BackendPartner {
  id: string;
  companyName: string;
  companyType: string;
  contactPhone: string;
  contactEmail: string | null;
  registrationNumber: string | null;
  createdAt: string;
}

export const toPartner = (p: BackendPartner): PendingPartner => ({ id: p.id, company: p.companyName, type: p.companyType, phone: p.contactPhone, email: p.contactEmail, registrationNumber: p.registrationNumber, createdAt: p.createdAt });

export class HttpPartnersRepository implements PartnersRepository {
  async pending() {
    const { partners } = await http.get<{ partners: BackendPartner[] }>(API.partners.pending);
    return partners.map(toPartner);
  }
  async validate(id: string) {
    await http.patch(API.partners.validate(id));
  }
}
