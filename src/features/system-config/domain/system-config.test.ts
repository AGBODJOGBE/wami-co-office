import { describe, expect, it } from "vitest";
import { toParam, toVersion, type BackendParam } from "../application/system-config.http-repository";
import { boundsViolation, compareVersions, paramBlocker, raisesMinimum, versionBlocker } from "./system-config";

const raw: BackendParam = { key: "ride.radius", value: "5", type: "NUMBER", description: "Rayon", updatedBy: "u", version: 2, updatedAt: "x", forcedOutOfBounds: false, module: "Courses", label: "Rayon", unit: "km", displayValue: "5 km", min: 1, max: 15, mustDivide: 1 };
const p = toParam(raw);

describe("configuration système (backend wami-co)", () => {
  it("convertit un paramètre", () => {
    expect(p).toMatchObject({ key: "ride.radius", label: "Rayon", module: "Courses", min: 1, max: 15, display: "5 km", outOfBounds: false });
    expect(toParam({ ...raw, label: undefined, module: undefined, displayValue: undefined, min: undefined, max: undefined })).toMatchObject({ label: "ride.radius", module: "autre", display: "5", min: null });
  });
  it("bornes : numérique, min, max, multiple, valeurs permises", () => {
    expect(boundsViolation(p, "10")).toBeNull();
    expect(boundsViolation(p, "0")).toMatch(/Minimum/);
    expect(boundsViolation(p, "20")).toMatch(/Maximum/);
    expect(boundsViolation(p, "abc")).toMatch(/numérique/);
    expect(boundsViolation({ ...p, mustDivide: 5, min: 0 }, "7")).toMatch(/multiple de 5/);
    expect(boundsViolation({ ...p, allowed: ["A", "B"] }, "C")).toMatch(/permises/);
    expect(boundsViolation({ ...p, type: "BOOLEAN", min: null, max: null }, "oui")).toMatch(/true ou false/);
  });
  it("modification : super admin, changement, bornes, forçage justifié", () => {
    expect(paramBlocker(p, { value: "8", force: false, justification: "" }, false)).toMatch(/super admin/);
    expect(paramBlocker(p, { value: "5", force: false, justification: "" }, true)).toMatch(/Aucune/);
    expect(paramBlocker(p, { value: "8", force: false, justification: "" }, true)).toBeNull();
    expect(paramBlocker(p, { value: "40", force: false, justification: "" }, true)).toMatch(/forcer/);
    expect(paramBlocker(p, { value: "40", force: true, justification: "court" }, true)).toMatch(/Justification/);
    expect(paramBlocker(p, { value: "40", force: true, justification: "Pic de demande exceptionnel" }, true)).toBeNull();
  });
  it("versions : comparaison x.y.z", () => {
    expect(compareVersions("1.2.0", "1.10.0")).toBeLessThan(0);
    expect(compareVersions("2.0.0", "1.9.9")).toBeGreaterThan(0);
    expect(compareVersions("1.0.0", "1.0.0")).toBe(0);
  });
  it("versions : règles de saisie et mise à jour forcée", () => {
    const v = toVersion({ id: "1", appType: "DRIVER", platform: "ANDROID", packageId: "bj.wami.driver", latestVersion: "1.4.0", latestBuild: 42, minSupportedVersion: "1.2.0", minSupportedBuild: 30, forceUpdateAfter: null, downloadUrl: "https://x.bj", releaseNotes: "", updatedAt: "x" });
    const draft = { ...v };
    expect(versionBlocker(draft)).toBeNull();
    expect(versionBlocker({ ...draft, latestVersion: "1.4" })).toMatch(/x\.y\.z/);
    expect(versionBlocker({ ...draft, minVersion: "1.5.0" })).toMatch(/dépasser/);
    expect(versionBlocker({ ...draft, minBuild: 99 })).toMatch(/build/i);
    expect(versionBlocker({ ...draft, downloadUrl: "ftp://x" })).toMatch(/Lien/);
    expect(raisesMinimum(v, { ...draft, minVersion: "1.3.0" })).toBe(true);
    expect(raisesMinimum(v, { ...draft, latestVersion: "1.5.0" })).toBe(false);
  });
});
