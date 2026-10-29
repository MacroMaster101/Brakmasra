import type { MemberRole } from "@/lib/roles";
import { slugify } from "@/lib/store-admin-validation";

/** Browser-supplied address controls only apply to Web Dev. Existing links stay stable by default. */
export function productAddressPolicy(role: MemberRole | null, mode: string, regenerate: boolean, editing: boolean) {
  const custom = role === "web_dev" && mode !== "auto";
  return { custom, preserve: editing && !custom && !(role === "web_dev" && mode === "auto" && regenerate) };
}

export function automaticProductSlug(name: string) {
  return slugify(name) || "product";
}

export function suffixedProductSlug(base: string, suffix: string) {
  return `${base.slice(0, 70).replace(/-+$/, "")}-${suffix}`;
}
