import { describe, expect, it } from "vitest";
import { assignableRoles, can, hasRoleAtLeast, isStaff, parseRole } from "@/lib/roles";

describe("member roles", () => {
  it("reads roles and maps the older names", () => {
    expect(parseRole("web_dev")).toBe("web_dev");
    expect(parseRole("owner")).toBe("owner");
    expect(parseRole("staff")).toBe("staff");
    expect(parseRole("supporter")).toBe("supporter");
    expect(parseRole("admin")).toBe("staff");
    expect(parseRole("support")).toBe("supporter");
    expect(parseRole("editor")).toBeNull();
    expect(parseRole("WEB_DEV")).toBeNull();
    expect(parseRole(undefined)).toBeNull();
  });

  it("ranks Web Dev > Owner > Staff > Supporter > member", () => {
    expect(hasRoleAtLeast("web_dev", "owner")).toBe(true);
    expect(hasRoleAtLeast("owner", "owner")).toBe(true);
    expect(hasRoleAtLeast("staff", "owner")).toBe(false);
    expect(hasRoleAtLeast("supporter", "staff")).toBe(false);
    expect(hasRoleAtLeast(null, "supporter")).toBe(false);
  });

  it("treats supporters exactly like members for access", () => {
    expect(isStaff("supporter")).toBe(false);
    expect(isStaff(null)).toBe(false);
    expect(isStaff("staff")).toBe(true);
    expect(can("supporter", "control_room")).toBe(false);
    expect(can("supporter", "view_messages")).toBe(false);
  });

  it("gives Web Dev full access and narrows it by role", () => {
    expect(can("web_dev", "manage_site")).toBe(true);
    expect(can("owner", "manage_site")).toBe(false);
    expect(can("owner", "manage_team")).toBe(true);
    expect(can("staff", "manage_team")).toBe(false);
    expect(can("staff", "view_orders")).toBe(true);
    expect(can("staff", "view_newsletter")).toBe(false);
    expect(can(null, "control_room")).toBe(false);
  });

  it("lets staff view the shop while only Owner and Web Dev change it", () => {
    for (const permission of ["view_catalog", "view_orders"] as const) {
      expect(can("staff", permission)).toBe(true);
    }
    for (const permission of ["manage_catalog", "manage_orders", "manage_messages", "manage_newsletter"] as const) {
      expect(can("staff", permission)).toBe(false);
      expect(can("owner", permission)).toBe(true);
      expect(can("web_dev", permission)).toBe(true);
      expect(can("supporter", permission)).toBe(false);
    }
  });

  it("only lets higher roles change lower ones", () => {
    expect(assignableRoles("web_dev", null)).toEqual(["owner", "staff", "supporter", null]);
    expect(assignableRoles("web_dev", "owner")).toEqual(["owner", "staff", "supporter", null]);
    expect(assignableRoles("web_dev", "web_dev")).toEqual([]);
    expect(assignableRoles("owner", null)).toEqual(["staff", "supporter", null]);
    expect(assignableRoles("owner", "supporter")).toEqual(["staff", "supporter", null]);
    expect(assignableRoles("owner", "owner")).toEqual([]);
    expect(assignableRoles("owner", "web_dev")).toEqual([]);
    expect(assignableRoles("staff", null)).toEqual([]);
    expect(assignableRoles("supporter", null)).toEqual([]);
    expect(assignableRoles(null, null)).toEqual([]);
  });
});
