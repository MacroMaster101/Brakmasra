import "server-only";
import { parseUsdRate } from "@/lib/currency";

/** Daily indicative rates, cached hourly. Only used for browsing estimates. */
export async function getUsdRate(): Promise<number | null> {
  try {
    const response = await fetch("https://open.er-api.com/v6/latest/LKR", {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(3000),
    });
    return response.ok ? parseUsdRate(await response.json()) : null;
  } catch {
    return null;
  }
}
