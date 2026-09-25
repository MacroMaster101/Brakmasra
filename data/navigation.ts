import type { TextKey } from "@/lib/i18n";

export type NavLink = { label: string; labelKey: TextKey; href: string };

export const primaryNav: NavLink[] = [
  { label: "Home", labelKey: "navHome", href: "/" },
  { label: "Shop", labelKey: "navShop", href: "/shop" },
  { label: "About", labelKey: "navAbout", href: "/about" },
  { label: "Contact", labelKey: "navContact", href: "/contact" },
];

export const authNav: NavLink = { label: "Log in", labelKey: "navLogin", href: "/login" };
export const joinNav: NavLink = { label: "Join", labelKey: "navJoin", href: "/signup" };

/** Rows in the signed-in member menu (header dropdown and mobile drawer). */
export const memberNav: NavLink[] = [
  { label: "My profile", labelKey: "navMyProfile", href: "/account" },
  { label: "My orders", labelKey: "navMyOrders", href: "/account/orders" },
  { label: "Settings", labelKey: "navSettings", href: "/account/settings" },
];

/** Shown only to roles with Control Room access; the pages check again on the server. */
export const controlRoomNav: NavLink = { label: "Control Room", labelKey: "navControlRoom", href: "/admin" };

export const footerColumns: { title: string; titleKey: TextKey; links: NavLink[] }[] = [
  {
    title: "Store",
    titleKey: "footerColStore",
    links: [
      { label: "All Products", labelKey: "footerAllProducts", href: "/shop" },
      { label: "Cart", labelKey: "footerCart", href: "/cart" },
    ],
  },
  {
    title: "Brand",
    titleKey: "footerColBrand",
    links: [
      { label: "Our story", labelKey: "footerOurStory", href: "/about" },
      { label: "Archive", labelKey: "footerArchive", href: "/about" },
    ],
  },
  {
    title: "Support",
    titleKey: "footerColSupport",
    links: [
      { label: "Order support", labelKey: "footerOrderSupport", href: "/contact" },
      { label: "Contact", labelKey: "footerContact", href: "/contact" },
    ],
  },
  {
    title: "Explore",
    titleKey: "footerColExplore",
    links: [
      { label: "Home", labelKey: "footerHome", href: "/" },
      { label: "Collection", labelKey: "footerCollection", href: "/shop" },
    ],
  },
];
