import { describe, expect, it } from "vitest";
import { isOverdue, refundBlocker, type Ticket } from "./ticket";

const now = new Date("2026-11-05T12:00:00Z");

const ticket = (over: Partial<Ticket> = {}): Ticket => ({
  id: "T1",
  subject: "Remboursement",
  category: "refund",
  requesterName: "X",
  requesterKind: "client",
  openedAt: "2026-11-05T10:30:00Z",
  slaMinutes: 60,
  status: "open",
  priority: "normal",
  assignee: null,
  messages: [{ id: "m1", from: "requester", author: "X", text: "…", at: "2026-11-05T10:30:00Z" }],
  payment: { reference: "WMI-1", estimated: 1800, paid: 9000, method: "momo", alreadyRefunded: 0 },
  ...over,
});

describe("support", () => {
  it("délai dépassé sans réponse d’agent", () => {
    expect(isOverdue(ticket(), now)).toBe(true);
    expect(isOverdue(ticket({ messages: [{ id: "a", from: "agent", author: "A", text: "Bonjour", at: now.toISOString() }] }), now)).toBe(false);
  });

  it("le Support est plafonné, la Finance non", () => {
    expect(refundBlocker(ticket(), 6000, "support")).toMatch(/Finance/);
    expect(refundBlocker(ticket(), 6000, "finance")).toBeNull();
  });

  it("jamais plus que ce qui a été payé", () => {
    expect(refundBlocker(ticket(), 9500, "superAdmin")).not.toBeNull();
  });
});
