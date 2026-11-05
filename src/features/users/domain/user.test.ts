import { describe, expect, it } from "vitest";
import { toUser } from "../application/users.http-repository";
import { roleLabel, searchBlocker } from "./user";

describe("utilisateurs (backend wami-co)", () => {
  it("convertit un utilisateur", () => {
    expect(toUser({ userId: "u1", firstName: "Gisèle", lastName: "A", phoneNumber: "+229", email: null, role: "PASSENGER", isActive: false, createdAt: "2026-11-01T00:00:00Z" })).toMatchObject({ id: "u1", name: "Gisèle A", active: false });
  });
  it("libellés de rôle et recherche de 2 caractères minimum", () => {
    expect(roleLabel("DRIVER")).toBe("Chauffeur");
    expect(roleLabel("AUTRE")).toBe("AUTRE");
    expect(searchBlocker("a")).not.toBeNull();
    expect(searchBlocker("")).toBeNull();
    expect(searchBlocker("ko")).toBeNull();
  });
});
