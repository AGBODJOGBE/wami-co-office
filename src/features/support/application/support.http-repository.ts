import { API } from "@/shared/config/api-routes";
import { http } from "@/shared/lib/http";
import type { Ticket } from "../domain/ticket";
import type { SupportRepository } from "../domain/support.repository";

export class HttpSupportRepository implements SupportRepository {
  list() {
    return http.get<Ticket[]>(API.support.tickets);
  }
  reply(ticketId: string, text: string, internal: boolean) {
    return http.post<Ticket>(API.support.reply(ticketId), { text, internal });
  }
  refund(ticketId: string, amount: number) {
    return http.post<Ticket>(API.support.refund(ticketId), { amount });
  }
  close(ticketId: string) {
    return http.post<Ticket>(API.support.close(ticketId));
  }
}
