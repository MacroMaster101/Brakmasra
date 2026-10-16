import masters from "@/data/image-masters.json";

const photographicMasters: Record<string, string> = masters;

/** Local photographic masters only. Remote uploads, logos and flags are unchanged. */
export function highResolutionImage(src: string) {
  return Object.hasOwn(photographicMasters, src) ? photographicMasters[src] : src;
}
