export type NavLink = { label: string; href: string };

export const primaryNav: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const authNav: NavLink = { label: "Log in", href: "/login" };

export const footerColumns: { title: string; links: NavLink[] }[] = [
  {
    title: "Store",
    links: [
      { label: "All Products", href: "/shop" },
      { label: "Cart", href: "/cart" },
    ],
  },
  {
    title: "Brand",
    links: [
      { label: "Our story", href: "/about" },
      { label: "Archive", href: "/about" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Order support", href: "/contact" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Explore",
    links: [
      { label: "Home", href: "/" },
      { label: "Collection", href: "/shop" },
    ],
  },
];
