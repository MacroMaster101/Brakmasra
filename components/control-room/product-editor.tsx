"use client";

import { ProductForm } from "@/components/control-room/product-form";
import { ProductPhotos } from "@/components/control-room/product-photos";
import { SectionGate, SectionPanel } from "@/components/control-room/shared";
import { BackLink, Notice } from "@/components/control-room/store-shared";
import type { SectionData } from "@/lib/control-room-validation";
import type { TextKey } from "@/lib/i18n";
import type { AdminProduct } from "@/lib/store-admin";

/** Product details and stock, then its photos once the product exists. */
export function ProductEditor({ data, canManage, notice }: {
  data: SectionData<AdminProduct | null>;
  canManage: boolean;
  notice: TextKey | null;
}) {
  return (
    <>
      <BackLink href="/admin/products" label="crsBackToProducts" />
      <SectionGate data={data}>
        {(product) => (
          <>
            <SectionPanel
              id="crs-product-title"
              title={product ? (canManage ? "crsEditProduct" : "crsViewProduct") : "crsNewProduct"}
              desc={product ? "crsEditProductDesc" : "crsNewProductDesc"}
            >
              <Notice text={notice} />
              {/* Remount after each save so the form shows what was stored. */}
              <ProductForm key={product?.updatedAt ?? "new"} product={product} canManage={canManage} />
            </SectionPanel>
            {product
              ? <ProductPhotos productId={product.id} images={product.images} canManage={canManage} />
              : null}
          </>
        )}
      </SectionGate>
    </>
  );
}
