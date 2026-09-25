import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  canChangeRole,
  changeRoleSchema,
  controlRoomSections,
  findMemberSchema,
  messageStatusSchema,
  parseMessageFilter,
  roleChoicesFor,
  roleFromChoice,
} from "@/lib/control-room-validation";
import type { MemberRole } from "@/lib/roles";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const person = (n: number, role: MemberRole | null) => ({ id: id(n), role });

describe("Control Room sections", () => {
  it("shows each role only the sections it may use", () => {
    const shop = ["products", "collections", "discounts", "orders", "messages"];
    expect(controlRoomSections("web_dev")).toEqual(["overview", ...shop, "subscribers", "team", "site"]);
    expect(controlRoomSections("owner")).toEqual(["overview", ...shop, "subscribers", "team"]);
    expect(controlRoomSections("staff")).toEqual(["overview", ...shop]);
  });

  it("gives supporters and regular members nothing", () => {
    expect(controlRoomSections("supporter")).toEqual([]);
    expect(controlRoomSections(null)).toEqual([]);
  });
});

describe("Control Room input", () => {
  it("accepts only known message filters", () => {
    expect(parseMessageFilter("new")).toBe("new");
    expect(parseMessageFilter("spam")).toBe("spam");
    expect(parseMessageFilter(["read", "new"])).toBe("read");
    expect(parseMessageFilter("all")).toBe("all");
    expect(parseMessageFilter("deleted")).toBe("all");
    expect(parseMessageFilter("NEW")).toBe("all");
    expect(parseMessageFilter(undefined)).toBe("all");
  });

  it("validates message status changes", () => {
    expect(messageStatusSchema.safeParse({ id: id(1), status: "resolved" }).success).toBe(true);
    expect(messageStatusSchema.safeParse({ id: "1; drop table", status: "resolved" }).success).toBe(false);
    expect(messageStatusSchema.safeParse({ id: id(1), status: "deleted" }).success).toBe(false);
  });

  it("normalises the lookup email", () => {
    const parsed = findMemberSchema.safeParse({ email: "  Fan@Example.COM " });
    expect(parsed.success && parsed.data.email).toBe("fan@example.com");
    expect(findMemberSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
  });

  it("accepts only known roles, with none meaning no role", () => {
    expect(changeRoleSchema.safeParse({ userId: id(2), role: "staff" }).success).toBe(true);
    expect(changeRoleSchema.safeParse({ userId: id(2), role: "none" }).success).toBe(true);
    expect(changeRoleSchema.safeParse({ userId: id(2), role: "admin" }).success).toBe(false);
    expect(changeRoleSchema.safeParse({ userId: id(2), role: "" }).success).toBe(false);
    expect(changeRoleSchema.safeParse({ userId: "someone", role: "staff" }).success).toBe(false);
    expect(roleFromChoice("none")).toBeNull();
    expect(roleFromChoice("owner")).toBe("owner");
  });
});

describe("role changes", () => {
  const webDev = person(1, "web_dev");
  const owner = person(2, "owner");
  const staff = person(3, "staff");

  it("never lets anyone change their own role", () => {
    expect(canChangeRole(webDev, webDev, "owner")).toBe(false);
    expect(canChangeRole(owner, owner, null)).toBe(false);
    expect(roleChoicesFor(owner, owner)).toEqual([]);
  });

  it("never grants Web Dev from the Control Room", () => {
    expect(canChangeRole(webDev, person(9, null), "web_dev")).toBe(false);
    expect(canChangeRole(webDev, person(9, "owner"), "web_dev")).toBe(false);
  });

  it("lets Web Dev manage owners, staff, and supporters but not another Web Dev", () => {
    expect(canChangeRole(webDev, person(9, null), "owner")).toBe(true);
    expect(canChangeRole(webDev, person(9, "owner"), null)).toBe(true);
    expect(canChangeRole(webDev, person(9, "supporter"), "staff")).toBe(true);
    expect(canChangeRole(webDev, person(9, "web_dev"), null)).toBe(false);
    expect(roleChoicesFor(webDev, person(9, null))).toEqual(["owner", "staff", "supporter", "none"]);
  });

  it("lets owners manage staff and supporters only", () => {
    expect(canChangeRole(owner, person(9, null), "staff")).toBe(true);
    expect(canChangeRole(owner, person(9, "staff"), "supporter")).toBe(true);
    expect(canChangeRole(owner, person(9, "supporter"), null)).toBe(true);
    expect(canChangeRole(owner, person(9, null), "owner")).toBe(false);
    expect(canChangeRole(owner, person(9, "owner"), null)).toBe(false);
    expect(canChangeRole(owner, person(9, "web_dev"), null)).toBe(false);
    expect(roleChoicesFor(owner, person(9, "owner"))).toEqual([]);
  });

  it("gives staff, supporters, and members no way to change roles", () => {
    for (const actor of [staff, person(4, "supporter"), person(5, null)]) {
      expect(canChangeRole(actor, person(9, null), "supporter")).toBe(false);
      expect(roleChoicesFor(actor, person(9, null))).toEqual([]);
    }
  });
});

describe("Control Room server code", () => {
  const read = (file: string) => readFileSync(join(process.cwd(), file), "utf8");

  it("re-checks the viewer's role from the session in every action", () => {
    const source = read("app/admin/actions.ts");
    const actions = source.split("export async function ").slice(1);
    expect(actions).toHaveLength(5);
    for (const action of actions) {
      expect(action).toMatch(/^[^{]+\{\s+(?:\/\/[^\n]*\n\s+)?const viewer = await viewerWith\("(view_messages|manage_messages|manage_newsletter|manage_team)"\);\s+if \(!viewer\) return notAvailable;/);
    }
    expect(source).toContain("canChangeRole(viewer, target, requested)");
  });

  it("checks the manage permission first in every store action", () => {
    const actions = read("app/admin/store-actions.ts").split("export async function ").slice(1);
    expect(actions.length).toBeGreaterThanOrEqual(12);
    for (const action of actions) {
      expect(action).toMatch(/^[^{]+\{\s+const checked = await guard\("(manage_catalog|manage_orders)"/);
    }
    expect(read("app/admin/subscribers/export/route.ts")).toContain('await viewerWith("manage_newsletter")');
  });

  it("gates every Control Room page on the server", () => {
    const pages: [string, string][] = [
      ["app/admin/layout.tsx", "control_room"],
      ["app/admin/page.tsx", "control_room"],
      ["app/admin/messages/page.tsx", "view_messages"],
      ["app/admin/orders/page.tsx", "view_orders"],
      ["app/admin/subscribers/page.tsx", "view_newsletter"],
      ["app/admin/team/page.tsx", "manage_team"],
      ["app/admin/products/page.tsx", "view_catalog"],
      ["app/admin/products/new/page.tsx", "manage_catalog"],
      ["app/admin/products/[id]/page.tsx", "view_catalog"],
      ["app/admin/collections/page.tsx", "view_catalog"],
      ["app/admin/collections/new/page.tsx", "manage_catalog"],
      ["app/admin/collections/[id]/page.tsx", "view_catalog"],
      ["app/admin/discounts/page.tsx", "view_catalog"],
      ["app/admin/discounts/new/page.tsx", "manage_catalog"],
      ["app/admin/discounts/[id]/page.tsx", "view_catalog"],
      ["app/admin/orders/[publicId]/page.tsx", "view_orders"],
      ["app/admin/site/page.tsx", "manage_site"],
    ];
    for (const [file, permission] of pages) {
      expect(read(file), file).toContain(`await requireControlRoom("${permission}"`);
    }
  });

  it("logs role changes without pointing actor_id at auth users", () => {
    expect(read("app/admin/action-helpers.ts")).toContain("actor_id: null");
    expect(read("app/admin/actions.ts")).toContain('audit(viewer, "role.change", "user", target.id');
  });
});
