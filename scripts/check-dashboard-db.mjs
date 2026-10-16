// Exercises disposable records inside one transaction that is ALWAYS rolled back.
// Never runs payments, emails, or updates/deletes existing customer records.
import { config } from "dotenv";
import postgres from "postgres";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
config({ quiet: true });
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const sql = postgres(process.env.DATABASE_URL, { max: 1, connect_timeout: 15 });
const marker = new Error("ROLLBACK_DASHBOARD_CHECK");
let passed = 0;
const check = (value, label) => { assert.ok(value, label); passed++; console.log(`PASS ${label}`); };
try {
  await sql.begin(async (tx) => {
    const suffix = randomUUID();
    const product = { slug: `qa-${suffix}`, name: "Disposable dashboard check", description: "Only visible inside a rolled-back transaction.", price_minor: 10000, fabric: "Cotton", care: ["Read label"], status: "draft", category: "Apparel", badge: null, coming_soon: false, featured: false, position: 0, si_description: null, si_fabric: null, si_care: [] };
    const variants = [{ size: "M", color: "Black", inventory: 3 }];
    const [created] = await tx`select public.admin_save_product(null,${tx.json(product)},${tx.json(variants)}) as id`;
    const productId = created.id;
    check((await tx`select * from products where id=${productId}`)[0].status === "draft", "Product create/read");
    await tx`select public.admin_save_product(${productId},${tx.json({ ...product, name: "Updated dashboard check" })},${tx.json([{ ...variants[0], inventory: 7 }])})`;
    const [variant] = await tx`select * from product_variants where product_id=${productId}`;
    check(variant.inventory === 7, "Product update and stock sync");
    let rejected = false;
    try { await tx.savepoint((save) => save`select public.admin_save_product(${productId},${save.json({ ...product, name: "Must not be saved" })},${save.json([{ ...variants[0], inventory: -1 }])})`); } catch { rejected = true; }
    check(rejected && (await tx`select name from products where id=${productId}`)[0].name === "Updated dashboard check", "Failed stock update rolls back product details");
    const collection = { slug: `qa-${suffix}`, name: "Disposable collection", description: null, active: false };
    const [createdCollection] = await tx`select public.admin_save_collection(null,${tx.json(collection)},${[productId]}::uuid[]) as id`;
    const collectionId = createdCollection.id;
    check((await tx`select product_id from collection_products where collection_id=${collectionId}`)[0].product_id === productId, "Collection create/read and membership");
    rejected = false;
    try { await tx.savepoint((save) => save`select public.admin_save_collection(${collectionId},${save.json({ ...collection, name: "Must not be saved" })},${[randomUUID()]}::uuid[])`); } catch { rejected = true; }
    check(rejected && (await tx`select name from collections where id=${collectionId}`)[0].name === collection.name && (await tx`select product_id from collection_products where collection_id=${collectionId}`).length === 1, "Failed membership update preserves collection and links");
    await tx`select public.admin_save_collection(${collectionId},${tx.json({ ...collection, name: "Updated collection" })},${[]}::uuid[])`;
    check((await tx`select * from collection_products where collection_id=${collectionId}`).length === 0, "Collection update clears membership intentionally");
    const images = await tx`insert into product_images(product_id,url,alt_text,position) values(${productId},'/images/about/courtyard-campaign.webp','QA image one',0),(${productId},'/images/about/graphic-still-life.webp','QA image two',1) returning id`;
    await tx`select public.admin_move_product_image(${images[0].id},'down')`;
    check((await tx`select id from product_images where product_id=${productId} order by position`)[0].id === images[1].id, "Photo ordering is saved atomically");
    await tx`update product_images set alt_text='Updated description' where id=${images[0].id}`;
    check((await tx`select alt_text from product_images where id=${images[0].id}`)[0].alt_text === "Updated description", "Photo description update");
    const [discount] = await tx`insert into discounts(code,kind,value,active) values(${`QA-${suffix}`},'percent',10,false) returning id`;
    await tx`update discounts set value=15 where id=${discount.id}`;
    check((await tx`select value from discounts where id=${discount.id}`)[0].value === 15, "Discount create/read/update");
    await tx`delete from discounts where id=${discount.id}`;
    check((await tx`select id from discounts where id=${discount.id}`).length === 0, "Discount delete");
    const [order] = await tx`insert into orders(public_id,status,currency,subtotal_minor,total_minor,customer_email) values(${`QA-${suffix}`},'pending','LKR',10000,10000,'dashboard-check@example.invalid') returning id`;
    await tx`insert into order_items(order_id,variant_id,product_name,quantity,unit_price_minor) values(${order.id},${variant.id},'QA product',1,10000)`;
    await tx`update orders set tracking_number='QA-TRACKING',admin_note='Disposable check' where id=${order.id}`;
    check((await tx`select tracking_number from orders where id=${order.id}`)[0].tracking_number === "QA-TRACKING", "Order read/fulfilment notes update");
    await tx`select public.admin_save_product(${productId},${tx.json(product)},${tx.json([{ size: "L", color: "White", inventory: 2 }])})`;
    check((await tx`select active from product_variants where id=${variant.id}`)[0].active === false, "Variants referenced by orders are retained and disabled");
    rejected = false;
    try { await tx.savepoint((save) => save`delete from products where id=${productId}`); } catch { rejected = true; }
    check(rejected, "Products with order history cannot be hard-deleted");
    const [message] = await tx`insert into contact_messages(name,email,topic,message) values('QA','dashboard-check@example.invalid','general','Disposable dashboard check') returning id`;
    await tx`update contact_messages set status='resolved' where id=${message.id}`;
    check((await tx`select status from contact_messages where id=${message.id}`)[0].status === "resolved", "Message read/status update");
    await tx`delete from contact_messages where id=${message.id}`;
    check((await tx`select id from contact_messages where id=${message.id}`).length === 0, "Message delete");
    const [subscriber] = await tx`insert into newsletter_subscribers(email,consented_at,status) values(${`qa-${suffix}@example.invalid`},now(),'pending') returning id`;
    check((await tx`select status from newsletter_subscribers where id=${subscriber.id}`)[0].status === "pending", "Subscriber read");
    await tx`delete from newsletter_subscribers where id=${subscriber.id}`;
    check((await tx`select id from newsletter_subscribers where id=${subscriber.id}`).length === 0, "Subscriber remove");
    const key = `qa-dashboard-${suffix}`;
    await tx`insert into site_settings(key,value) values(${key},${tx.json({ draft: "private" })})`;
    await tx`update site_settings set value=${tx.json({ draft: "new", published: "live" })} where key=${key}`;
    check((await tx`select value from site_settings where key=${key}`)[0].value.published === "live", "Content document create/read/update");
    await tx`delete from site_settings where key=${key}`;
    const permissions = await tx`select has_function_privilege('anon','public.admin_save_product(uuid,jsonb,jsonb)','EXECUTE') as anon,has_function_privilege('authenticated','public.admin_save_product(uuid,jsonb,jsonb)','EXECUTE') as member,has_function_privilege('service_role','public.admin_save_product(uuid,jsonb,jsonb)','EXECUTE') as service`;
    check(!permissions[0].anon && !permissions[0].member && permissions[0].service, "Catalog mutations are executable only by the service role");
    const tables = ["products", "product_variants", "product_images", "collections", "collection_products", "orders", "order_items", "discounts", "contact_messages", "newsletter_subscribers", "site_settings", "admin_audit_logs"];
    const policies = await tx`select tablename from pg_policies where schemaname='public' and tablename in ${tx(tables)} and (roles && array['anon','authenticated','public']::name[])`;
    const rls = await tx`select relname,relrowsecurity from pg_class join pg_namespace on pg_class.relnamespace=pg_namespace.oid where nspname='public' and relname in ${tx(tables)}`;
    check(rls.length === tables.length && rls.every((table) => table.relrowsecurity) && policies.length === 0, "Management tables enforce RLS without browser write/read policies");
    await tx`delete from collections where id=${collectionId}`;
    check((await tx`select id from collections where id=${collectionId}`).length === 0, "Collection delete");
    // Clear only our disposable order rows to check unreferenced product cleanup.
    await tx`delete from order_items where order_id=${order.id}`;
    await tx`delete from orders where id=${order.id}`;
    await tx`delete from products where id=${productId}`;
    check((await tx`select id from product_images where product_id=${productId}`).length === 0, "Product delete cascades photo/variant records");
    throw marker;
  });
} catch (error) {
  if (error !== marker) { console.error("Dashboard database check failed:", error.code ?? error.message); process.exitCode = 1; }
  else console.log(`${passed} checks passed. All disposable records rolled back.`);
} finally { await sql.end(); }
