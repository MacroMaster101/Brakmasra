import { describe, expect, it } from "vitest";
import { authNav, controlRoomNav, footerColumns, joinNav, memberNav, primaryNav } from "@/data/navigation";
import { translations } from "@/lib/i18n";

const storeRoutes = ["/", "/shop", "/about", "/contact", "/cart"];

describe("site navigation", () => {
  it("offers only the store pages in the primary menu", () => {
    expect(primaryNav.map((link) => link.href)).toEqual(["/", "/shop", "/about", "/contact"]);
  });

  it("offers clear log in and join actions in the site navigation", () => {
    expect(authNav).toEqual({ label: "Log in", labelKey: "navLogin", href: "/login" });
    expect(joinNav).toEqual({ label: "Join", labelKey: "navJoin", href: "/signup" });
  });

  it("points the member menu at the account pages", () => {
    expect(memberNav.map((link) => link.href)).toEqual(["/account", "/account/orders", "/account/settings"]);
  });

  it("points the staff link at the Control Room", () => {
    expect(controlRoomNav).toEqual({ label: "Control Room", labelKey: "navControlRoom", href: "/admin" });
  });

  it("links only to store routes from the footer", () => {
    const hrefs = footerColumns.flatMap((column) => column.links.map((link) => link.href));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) expect(storeRoutes).toContain(href);
  });

  it("labels every link through the translation dictionary", () => {
    const links = [...primaryNav, authNav, joinNav, controlRoomNav, ...memberNav, ...footerColumns.flatMap((column) => column.links)];
    for (const link of links) {
      expect(translations.en[link.labelKey]).toBe(link.label);
      expect(translations.si[link.labelKey]).toBeTruthy();
    }
    for (const column of footerColumns) expect(translations.en[column.titleKey]).toBe(column.title);
  });
});
