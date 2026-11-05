import type { Role } from "@/shared/auth/permissions";
import { fail, guard, type Result } from "@/shared/lib/result";
import { refundBlocker, replyBlocker, type Ticket } from "../domain/ticket";
import type { SupportRepository } from "../domain/support.repository";
import { HttpSupportRepository } from "./support.http-repository";

export function createSupportUseCases(repo: SupportRepository) {
  return {
    list: () => guard(() => repo.list()),
    reply: (t: Ticket, text: string, internal: boolean): Promise<Result<Ticket>> => {
      const blocker = replyBlocker(t, text);
      if (blocker) return Promise.resolve(fail("validation", blocker));
      return guard(() => repo.reply(t.id, text.trim(), internal));
    },
    refund: (t: Ticket, amount: number, role: Role): Promise<Result<Ticket>> => {
      const blocker = refundBlocker(t, amount, role);
      if (blocker) return Promise.resolve(fail("validation", blocker));
      return guard(() => repo.refund(t.id, amount));
    },
    close: (t: Ticket): Promise<Result<Ticket>> => {
      if (t.status === "closed") return Promise.resolve(fail("validation", "Ticket déjà clos."));
      return guard(() => repo.close(t.id));
    },
  };
}

export const supportUseCases = createSupportUseCases(new HttpSupportRepository());
