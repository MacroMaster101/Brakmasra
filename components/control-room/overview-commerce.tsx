"use client";
import Image from "@/components/store-image";
import { isRemoteImage } from "@/lib/store-mapping";
import Link from "next/link";
import { PackageOpen, Shirt, ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { SectionPanel, EmptyState, StatusPill } from "@/components/control-room/shared";
import { orderStatusLabels } from "@/components/control-room/orders";
import type { AdminOrder } from "@/lib/control-room";
import type { RankedProduct } from "@/lib/dashboard-sales";
import { formatMoney } from "@/lib/cart";
import { formatDate } from "@/lib/i18n";

export function TopProducts({ products, days }: { products: RankedProduct[] | null; days: number }) {
  const { t } = useLanguage();
  return <SectionPanel id="cr-top-sales" title="crTopSales" desc="crTopSalesDesc" actions={<span className="cr-period-label">{t.crPeriodDays(days)}</span>}>
    {products === null ? <EmptyState icon={PackageOpen} title="crLoadErrorTitle" desc="crLoadErrorDesc" /> : !products.length ? <EmptyState icon={Shirt} title="crSalesEmpty" desc="crSalesEmptyDesc" /> : <ol className="cr-top-products">{products.map((product, index) => <li key={product.productId}><span className="cr-product-rank">{String(index + 1).padStart(2, "0")}</span><span className="cr-product-thumb">{product.image ? <Image src={product.image} unoptimized={isRemoteImage(product.image)} alt="" width={48} height={58} /> : <Shirt size={22} />}</span><span className="cr-top-product-copy">{product.href ? <Link href={product.href}>{product.name}</Link> : <strong>{product.name}</strong>}<small>{t.crPaidUnits}</small></span><strong className="cr-units">{t.crUnitsSold(product.quantity)}</strong></li>)}</ol>}
  </SectionPanel>;
}

export function RecentOrders({ orders }: { orders: AdminOrder[] | null }) {
  const { t, lang } = useLanguage();
  return <SectionPanel id="cr-recent-orders" title="crRecentOrders" desc="crRecentOrdersDesc" actions={<Link href="/admin/orders" className="cms-link">{t.crViewAll}<ArrowUpRight size={15} /></Link>}>
    {orders === null ? <EmptyState icon={PackageOpen} title="crLoadErrorTitle" desc="crLoadErrorDesc" /> : !orders.length ? <EmptyState icon={PackageOpen} title="crOrdersEmpty" desc="crOrdersEmptyDesc" /> : <div className="cr-recent-table-wrap"><table className="cr-recent-table"><thead><tr><th>{t.accountOrderNumber}</th><th>{t.crCustomer}</th><th>{t.accountOrderPlaced}</th><th>{t.accountOrderStatus}</th><th>{t.accountOrderTotal}</th></tr></thead><tbody>{orders.map(order => <tr key={order.publicId}><td><Link href={`/admin/orders/${encodeURIComponent(order.publicId)}`}>{order.publicId}</Link></td><td>{order.customerEmail}</td><td><time dateTime={order.createdAt}>{formatDate(order.createdAt, lang)}</time></td><td><StatusPill tone={order.status}>{t[orderStatusLabels[order.status]]}</StatusPill></td><td>{formatMoney(order.totalMinor, order.currency)}</td></tr>)}</tbody></table></div>}
  </SectionPanel>;
}
