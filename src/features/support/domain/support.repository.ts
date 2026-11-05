import type { Ticket } from "./ticket";

export interface SupportRepository {
  list(): Promise<Ticket[]>;
  reply(ticketId: string, text: string, internal: boolean): Promise<Ticket>;
  refund(ticketId: string, amount: number): Promise<Ticket>;
  close(ticketId: string): Promise<Ticket>;
}
