import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getAccountMember } from "@/app/account/current-member";
import { OrdersList } from "@/components/account/orders-list";
import { authDemoMode, authEnabled } from "@/lib/features";
import { getMemberOrders } from "@/lib/orders";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage() {
  // The layout shows the closed state; pages may render alongside it, so bail out here too.
  if (!authEnabled) return null;
  const member = await getAccountMember();
  if (!member) redirect("/login?next=/account/orders");

  // The email comes from the verified session, never from the request.
  const orders = authDemoMode ? [] : await getMemberOrders(member.email);

  return <OrdersList orders={orders} />;
}
