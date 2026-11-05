import { describe, expect, it } from "vitest";
import { toMember } from "../application/rbac.http-repository";
import { accessChangeBlocker, deactivateBlocker, groupByModule, reactivateBlocker, registerBlocker, type NewMember } from "./rbac";

const raw = { adminId: "a1", firstName: "Ada", lastName: "Z", email: null, phoneNumber: "+229 97 00 00 01", roleId: "r1", roleName: "Support", status: "ACTIVE", createdAt: "2026-11-01T00:00:00Z" };
const admin = toMember(raw);
const draft: NewMember = { firstName: "Koffi", lastName: "Mensah", phone: "+229 97 00 00 02", password: "motdepasse", roleId: "r1" };

describe("administrateurs (backend wami-co)", () => {
  it("convertit un administrateur", () => {
    expect(admin).toMatchObject({ id: "a1", name: "Ada Z", status: "active", roleId: "r1" });
    expect(toMember({ ...raw, status: "DEACTIVATED" }).status).toBe("deactivated");
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
    const g = groupByModule([{ id: "1", code: "ride.view_all", name: "x", module: "ride" }, { id: "2", code: "driver.suspend", name: "y", module: "driver" }, { id: "3", code: "ride.update_status", name: "z", module: "ride" }]);
    expect(g.map(([m]) => m)).toEqual(["driver", "ride"]);
    expect(g[1]![1]).toHaveLength(2);
  });
});

describe("rôles et permissions", () => {
  const perm = (code: string, id = code) => ({ id, code, name: code, module: code.split(".")[0]! });
  const role = (name: string, codes: string[]) => ({ id: name, name, displayName: name, description: null, isSystem: true, permissions: codes.map((c) => perm(c)) });

  it("création : identifiant, doublon, nom affiché, permissions", async () => {
    const { roleDraftBlocker } = await import("./rbac");
    const roles = [role("SUPPORT", ["user.view_all"])];
    const ok = { name: "support_n2", displayName: "Support niveau 2", description: "", permissionCodes: ["user.view_all"] };
    expect(roleDraftBlocker(ok, roles)).toBeNull();
    expect(roleDraftBlocker({ ...ok, name: "2x" }, roles)).toMatch(/Identifiant/);
    expect(roleDraftBlocker({ ...ok, name: "support" }, roles)).toMatch(/existe déjà/);
    expect(roleDraftBlocker({ ...ok, displayName: "ab" }, roles)).toMatch(/Nom affiché/);
    expect(roleDraftBlocker({ ...ok, permissionCodes: [] }, roles)).toMatch(/permission/);
  });
  it("différence de permissions et règles de modification", async () => {
    const { permissionDiff, permissionUpdateBlocker } = await import("./rbac");
    const r = role("OPS", ["ride.view_all", "driver.view_all"]);
    expect(permissionDiff(r, ["ride.view_all", "wallet.view_all"])).toEqual({ add: ["wallet.view_all"], remove: ["driver.view_all"] });
    expect(permissionUpdateBlocker(r, ["ride.view_all", "driver.view_all"])).toMatch(/Aucune/);
    expect(permissionUpdateBlocker(r, ["ride.view_all"])).toBeNull();
    expect(permissionUpdateBlocker(r, [])).toMatch(/au moins une/);
    const sa = role("SUPER_ADMIN", ["admin.create", "ride.view_all"]);
    expect(permissionUpdateBlocker(sa, ["admin.create"])).toMatch(/SUPER_ADMIN/);
    expect(permissionUpdateBlocker(sa, ["admin.create", "ride.view_all", "wallet.view_all"])).toBeNull();
  });
  it("octroi d'une permission : pas à soi-même, compte actif, permission choisie", async () => {
    const { grantBlocker } = await import("./rbac");
    expect(grantBlocker(admin, "ride.view_all", "a1")).toMatch(/vous accorder/);
    expect(grantBlocker(admin, "", "autre")).toMatch(/Choisissez/);
    expect(grantBlocker({ ...admin, status: "deactivated" }, "ride.view_all", "autre")).toMatch(/actif/);
    expect(grantBlocker(admin, "ride.view_all", "autre")).toBeNull();
  });
});
