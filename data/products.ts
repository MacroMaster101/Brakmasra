export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  sizes: string[];
  colors: string[];
  fabric: string;
  care: string[];
  stock: number;
  badge?: "NEW" | "LIMITED" | "BEST SELLER" | "SALE";
};

// Deliberately empty until the owner supplies verified products, photography,
// pricing, inventory, materials, and care instructions.
export const products: Product[] = [];
