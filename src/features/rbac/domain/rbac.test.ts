import { describe, expect, it } from "vitest";
import { toMember } from "../application/rbac.http-repository";
import { accessChangeBlocker, deactivateBlocker, groupByModule, reactivateBlocker, registerBlocker, type NewMember } from "./rbac";

const admin = toMember({ adminId: "a1", firstName: "Ada", lastName: "Z", email: null, phoneNumber: "+229 97 00 00 01", roleId: "r1", roleName: "Support", status: "ACTIVE", createdAt: "2026-11-01T00:00:00Z" });
const draft: NewMember = { firstName: "Koffi", lastName: "Mensah", phone: "+229 97 00 00 02", password: "motdepasse", roleId: "r1" };

describe("administrateurs (backend wami-co)", () => {
  it("convertit un administrateur", () => {
    expect(admin).toMatchObject({ id: "a1", name: "Ada Z", status: "active", roleId: "r1" });
    expect(toMember({ ...admin, status: "DEACTIVATED" } as never).status).toBe("active");
  });
  it("création : champs, mot de passe, doublon de téléphone", () => {
    expect(registerBlocker(draft, [admin])).toBeNull();
    expect(registerBlocker({ ...draft, password: "court" }, [admin])).toMatch(/Mot de passe/);
    expect(registerBlocker({ ...draft, phone: "+22997000001" }, [admin])).toMatch(/déjà/);
    expect(registerBlocker({ ...draft, roleId: "" }, [admin])).toMatch(/rôle/);
  });
  it("on ne modifie ni ne désactive son propre accès", () => {
    expect(accessChangeBlocker(admin, "a1")).not.toBeNull();
    expect(deactivateBlocker(admin, "a1")).not.toBeNull();
    expect(deactivateBlocker(admin, "autre")).toBeNull();
    expect(reactivateBlocker(admin)).not.toBeNull();
  });
  it("regroupe les permissions par module", () => {
    const g = groupByModule([{ code: "ride.view_all", name: "x", module: "ride" }, { code: "driver.suspend", name: "y", module: "driver" }, { code: "ride.update_status", name: "z", module: "ride" }]);
    expect(g.map(([m]) => m)).toEqual(["driver", "ride"]);
    expect(g[1]![1]).toHaveLength(2);
  });
});
