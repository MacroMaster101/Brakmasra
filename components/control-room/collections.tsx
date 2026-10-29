"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowDown, ArrowUp, Layers, Pencil, Plus } from "lucide-react";

import { deleteCollectionAction, saveCollectionAction, saveCollectionSectionAction } from "@/app/admin/store-actions";
import { productStatusLabels } from "@/components/control-room/products";
import { EmptyState, SectionGate, SectionPanel, StatusPill } from "@/components/control-room/shared";
import { BackLink, DeleteForm, Field, Notice, SaveBar, Toggle, useCrForm } from "@/components/control-room/store-shared";
import { editorChanged } from "@/components/control-room/editor-dialog";
import { Resettable } from "@/components/control-room/resettable";
import { useLanguage } from "@/components/language-provider";
import type { SectionData } from "@/lib/control-room-validation";
import type { TextKey } from "@/lib/i18n";
import type { AdminCollection } from "@/lib/store-admin";
import { slugify, type ProductStatus } from "@/lib/store-admin-validation";

type ProductChoice = { id: string; name: string; status: ProductStatus };

export function ControlRoomCollections({ collections, canManage, notice }: {
  collections: SectionData<AdminCollection[]>;
  canManage: boolean;
  notice: TextKey | null;
}) {
  const { t } = useLanguage();
  return (
    <SectionPanel
      id="crs-collections-title"
      title="crsCollectionsTitle"
      desc="crsCollectionsDesc"
      actions={canManage ? (
        <Link className="button button-primary" href="/admin/collections/new">
          <Plus aria-hidden="true" />
          {t.crsNewCollection}
        </Link>
      ) : null}
    >
      <Notice text={notice} />
      <SectionGate data={collections}>
        {(list) => (list.length === 0
          ? <EmptyState icon={Layers} title="crsCollectionsEmpty" desc="crsCollectionsEmptyDesc" />
          : (
            <table className="cr-table">
              <thead>
                <tr>
                  <th scope="col">{t.crsName}</th>
                  <th scope="col">{t.crStatus}</th>
                  <th scope="col" className="is-end">{t.crsProductCount}</th>
                  {canManage && <th scope="col" className="is-end">{t.crsProductActions}</th>}
                </tr>
              </thead>
              <tbody>
                {list.map((collection) => (
                  <tr key={collection.id}>
                    <td data-label={t.crsName}>
                      <Link className="crs-row-link" href={`/admin/collections/${collection.id}`}>
                        <strong>{collection.name}</strong>
                        <small className="cr-mono">{collection.slug}</small>
                      </Link>
                    </td>
                    <td data-label={t.crStatus}>
                      <StatusPill tone={collection.active ? "active" : "draft"}>
                        {collection.active ? t.crsVisible : t.crsHidden}
                      </StatusPill>
                    </td>
                    <td data-label={t.crsProductCount} className="is-end">{collection.productIds.length}</td>
                    {canManage && <td data-label={t.crsProductActions} className="is-end"><Link className="crs-edit-product" href={`/admin/collections/${collection.id}`} aria-label={`${t.crEditRecord}: ${collection.name}`}><Pencil size={16} aria-hidden="true" />{t.crEditRecord}</Link></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
      </SectionGate>
    </SectionPanel>
  );
}

function CollectionForm({ collection, products, canManage, section, reset }: {
  collection: AdminCollection | null;
  products: ProductChoice[];
  canManage: boolean;
  section?: "basics" | "products";
  reset: () => void;
}) {
  const { t } = useLanguage();
  const { state, formAction, pending, onSubmit } = useCrForm(section ? saveCollectionSectionAction : saveCollectionAction);
  const [query, setQuery] = useState("");
  const [slug, setSlug] = useState(collection?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(collection));
  // Chosen products in display order.
  const [chosen, setChosen] = useState<string[]>(() => (collection?.productIds ?? []).filter((id) => products.some((product) => product.id === id)));
  const byId = new Map(products.map((product) => [product.id, product]));

  const toggle = (id: string) => setChosen((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  const move = (index: number, offset: number) => setChosen((current) => {
    const next = [...current];
    const target = index + offset;
    if (target < 0 || target >= next.length) return current;
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });

  return (
    <form className="crs-form" action={formAction} onSubmit={onSubmit}>
      {collection && <input type="hidden" name="id" value={collection.id} />}
      {section && <input type="hidden" name="section" value={section} />}
      {chosen.map((id) => <input key={id} type="hidden" name="productIds" value={id} />)}
      {(!section || section === "basics") && (<fieldset className="crs-fieldset" disabled={!canManage || pending}>
        <legend>{t.crsBasics}</legend>
          <div className="crs-section-fields">
        <div className="crs-grid">
          <Field label="crsName">
            <input
              name="name"
              required
              minLength={2}
              maxLength={80}
              defaultValue={collection?.name ?? ""}
              onChange={(event) => { if (!slugEdited) setSlug(slugify(event.target.value)); }}
            />
          </Field>
          <Field label="crsSlug" hint="crsCollectionSlugHint">
            <input
              name="slug"
              required
              maxLength={80}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              value={slug}
              onChange={(event) => { setSlugEdited(true); setSlug(event.target.value.toLowerCase()); }}
            />
          </Field>
          <Field label="crsDescription" wide>
            <textarea name="description" maxLength={500} rows={3} defaultValue={collection?.description ?? ""} />
          </Field>
        </div>
        <Toggle name="active" label="crsCollectionVisible" hint="crsCollectionVisibleHint" defaultChecked={collection?.active ?? false} />

          </div></fieldset>)}

      {(!section || section === "products") && (<fieldset className="crs-fieldset" disabled={!canManage || pending}>
        <legend>{t.crsCollectionProducts}</legend>
          <div className="crs-section-fields">
        <input className="crs-choice-search" type="search" aria-label={t.crSearchChoices} placeholder={t.crSearchChoices} value={query} onChange={event => setQuery(event.target.value)} />
        {products.length === 0
          ? <p className="crs-legend-note">{t.crsNoProductsYet}</p>
          : (
            <div className="crs-picker">
              <ul className="crs-choices">
                {products.filter(product => product.name.toLowerCase().includes(query.toLowerCase())).map((product) => (
                  <li key={product.id}>
                    <label>
                      <input type="checkbox" checked={chosen.includes(product.id)} onChange={() => toggle(product.id)} />
                      <span>{product.name}</span>
                      {product.status !== "active" && (
                        <StatusPill tone={product.status}>{t[productStatusLabels[product.status]]}</StatusPill>
                      )}
                    </label>
                  </li>
                ))}
              </ul>
              <div>
                <p className="crs-label">{t.crsCollectionOrder}</p>
                {chosen.length === 0
                  ? <p className="crs-legend-note">{t.crsCollectionNoneChosen}</p>
                  : (
                    <ol className="crs-order" onClickCapture={event => { if ((event.target as HTMLElement).closest("button")) editorChanged(event.currentTarget); }}>
                      {chosen.map((id, index) => (
                        <li key={id}>
                          <span>{byId.get(id)?.name ?? id}</span>
                          <span className="crs-photo-move">
                            <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={t.crsMoveUp} title={t.crsMoveUp}>
                              <ArrowUp aria-hidden="true" />
                            </button>
                            <button type="button" onClick={() => move(index, 1)} disabled={index === chosen.length - 1} aria-label={t.crsMoveDown} title={t.crsMoveDown}>
                              <ArrowDown aria-hidden="true" />
                            </button>
                          </span>
                        </li>
                      ))}
                    </ol>
                  )}
              </div>
            </div>
          )}

          </div></fieldset>)}

      <SaveBar pending={pending} state={state} canManage={canManage} label={collection ? "crSaveSection" : "crsCreateCollection"} onReset={reset} />
    </form>
  );
}

export function CollectionEditor({ data, canManage, notice }: {
  data: SectionData<{ collection: AdminCollection | null; products: ProductChoice[] }>;
  canManage: boolean;
  notice: TextKey | null;
}) {
  const { t } = useLanguage();
  return (
    <>
      <BackLink href="/admin/collections" label="crsBackToCollections" />
      <SectionGate data={data}>
        {({ collection, products }) => (
          <SectionPanel
            id="crs-collection-title"
            title={collection ? (canManage ? "crsEditCollection" : "crsViewCollection") : "crsNewCollection"}
            desc="crsCollectionFormDesc"
          >
            <Notice text={notice} />
            {collection?.active && <Link className="cms-link" href={`/shop?collection=${collection.slug}`} target="_blank" rel="noopener">{t.navShop} ↗</Link>}
            {(collection ? ["basics", "products"] as const : [undefined]).map(section => <Resettable key={`${collection?.id ?? "new"}:${section ?? "all"}`}>{reset => <CollectionForm collection={collection} products={products} canManage={canManage} section={section} reset={reset} />}</Resettable>)}
            {collection && canManage && (
              <section className="crs-danger" aria-labelledby="crs-delete-collection">
                <div>
                  <h3 id="crs-delete-collection">{t.crsDeleteCollection}</h3>
                  <p>{t.crsDeleteCollectionDesc}</p>
                </div>
                <DeleteForm action={deleteCollectionAction} id={collection.id} confirm="crsDeleteCollectionConfirm" />
              </section>
            )}
          </SectionPanel>
        )}
      </SectionGate>
    </>
  );
}
