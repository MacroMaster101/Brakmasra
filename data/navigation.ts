export type NavLink = { label: string; href: string };

export const primaryNav: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const authNav: NavLink = { label: "Log in", href: "/login" };

export const footerColumns: { title: string; links: NavLink[] }[] = [
  { title: "Store", links: [{ label: "Shop", href: "/shop" }, { label: "Cart", href: "/cart" }] },
  { title: "Help", links: [{ label: "Order support", href: "/contact" }] },
  { title: "Brand", links: [{ label: "Our story", href: "/about" }] },
];
