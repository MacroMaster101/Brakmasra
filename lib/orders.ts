import "server-only";

import { ORDER_STATUS_VALUES, type OrderStatusValue } from "@/lib/order-status";
import { getSupabaseServerClient } from "@/lib/supabase";

export const ORDER_STATUSES = ORDER_STATUS_VALUES;
export type OrderStatus = OrderStatusValue;

/** What the account orders list shows; safe to pass to client components. */
export type MemberOrder = {
  publicId: string;
  status: OrderStatus;
  currency: string;
  totalMinor: number;
  createdAt: string;
};

type OrderRow = {
  public_id: string;
  status: string;
  currency: string;
  total_minor: number;
  created_at: string;
};

function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

/**
 * The member's most recent orders. `orders` has RLS with no public policies,
 * so only the service role can read it; callers must pass the email from the
 * verified session, never one taken from the request.
 */
export async function getMemberOrders(email: string): Promise<MemberOrder[]> {
  const supabase = getSupabaseServerClient();
  const address = email.trim().toLowerCase();
  if (!supabase || !address) return [];

  try {
    const { data, error } = await supabase
      .from("orders")
      .select("public_id, status, currency, total_minor, created_at")
      .eq("customer_email", address)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error || !data) return [];

    return (data as OrderRow[]).flatMap((row) => (isOrderStatus(row.status)
      ? [{
        publicId: row.public_id,
        status: row.status,
        currency: row.currency.trim().toUpperCase(),
        totalMinor: row.total_minor,
        createdAt: row.created_at,
      }]
      : []));
  } catch {
    return [];
  }
}
