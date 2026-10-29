"use client";
import { RoundedSelect } from "@/components/control-room/rounded-select";
import { startTransition, useCallback, useEffect, useId, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { ArrowUpRight, FileText, Plus, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { saveContentAction } from "@/app/admin/content-actions";
import { SectionGate, ActionStatus } from "@/components/control-room/shared";
import { useCrForm } from "@/components/control-room/store-shared";
import { ConfirmDialog } from "@/components/control-room/confirm-dialog";
import { editorChanged, editorReset, formIdentity, EditorDialog } from "@/components/control-room/editor-dialog";
import { CONTENT_PAGES, PAGE_IMAGES, pageFieldGroup, mergePageSection, fieldLabel, pageDefaults, type ContentPageId, type CopyValues } from "@/lib/content-fields";
import type { ContentEntry } from "@/lib/content";
import type { SectionData } from "@/lib/control-room-validation";
import { journalPosts, type JournalPost } from "@/data/journal";
import { slugify } from "@/lib/store-admin-validation";

function mergeStory(base: JournalPost, value: JournalPost, section: string): JournalPost {
  if (!section) return value;
  if (section === "story:details") return { ...base, category: value.category, image: value.image, width: value.width, height: value.height, productSlug: value.productSlug };
  const [, lang, group] = section.split(":") as [string, "en" | "si", string];
  const copy = value.copy[lang];
  return { ...base, copy: { ...base.copy, [lang]: { ...base.copy[lang], ...(group === "body" ? { sections: copy.sections } : { title: copy.title, excerpt: copy.excerpt, imageAlt: copy.imageAlt, lead: copy.lead }) } } };
}
function PageCopyField({ field, value, imageList, onChange }: { field: string; value: string; imageList: string; onChange: (value: string) => void }) {
  return <label className="cms-field"><span>{fieldLabel(field)}</span>{field.startsWith("image.")
    ? <input list={imageList} value={value} maxLength={1000} onChange={event => onChange(event.target.value)} />
    : <textarea rows={value.length > 150 ? 4 : 2} maxLength={10000} value={value} onChange={event => onChange(event.target.value)} />}</label>;
}
function SectionActions({ section, pending, onReset }: { section: string; pending: boolean; onReset: (form: HTMLFormElement) => void }) {
  const { t } = useLanguage();
  return <div className="cms-section-actions"><button className="button button-primary" type="submit" name="section" value={section} disabled={pending}>{t.crSaveSection}</button><button className="button button-secondary" type="button" disabled={pending} onClick={event => { if (event.currentTarget.form) onReset(event.currentTarget.form); }}>{t.crResetSection}</button></div>;
}

const blankPost = (): JournalPost => ({ slug: "", category: "style", image: "/images/about/courtyard-campaign.webp", width: 1448, height: 1086, productSlug: "", copy: {
  en: { title: "", excerpt: "", imageAlt: "", lead: "", sections: [{ heading: "", paragraphs: [""] }] },
  si: { title: "", excerpt: "", imageAlt: "", lead: "", sections: [{ heading: "", paragraphs: [""] }] },
} });

type ContentProductChoice = { slug: string; name: string; image: string | null };

function Editor({ entry, pageId, starter, onClose, onSaved, products }: { entry?: ContentEntry; pageId?: ContentPageId; starter?: JournalPost; onClose: () => void; onSaved: (key: string, message: string) => void; products: ContentProductChoice[] }) {
  const router = useRouter();
  const imageList = useId();
  const images = [...new Set([...Object.values(PAGE_IMAGES).flatMap(value => Object.values(value ?? {})), ...journalPosts.map(post => post.image), ...products.flatMap(product => product.image ? [product.image] : [])])];
  const [lang, setLang] = useState<"en" | "si">("en");
  const [query, setQuery] = useState("");
  const [copy, setCopy] = useState<CopyValues>(() => pageId ? entry?.document.draft as CopyValues ?? pageDefaults(pageId) : { en: {}, si: {} });
  const [post, setPost] = useState<JournalPost>(() => !pageId ? entry?.document.draft as JournalPost ?? starter ?? blankPost() : blankPost());
  const initialCopy = pageId ? entry?.document.draft as CopyValues ?? pageDefaults(pageId) : { en: {}, si: {} };
  const initialPost = !pageId ? entry?.document.draft as JournalPost ?? starter ?? blankPost() : blankPost();
  const [baselineCopy, setBaselineCopy] = useState(initialCopy);
  const [baselinePost, setBaselinePost] = useState(initialPost);
  const dirty = JSON.stringify(pageId ? copy : post) !== JSON.stringify(pageId ? baselineCopy : baselinePost);
  const [confirmation, setConfirmation] = useState<{ question: string; run: () => void } | null>(null);
  const page = CONTENT_PAGES.find((item) => item.id === pageId);
  const key = entry?.key ?? (pageId ? `cms:page:${pageId}` : `cms:post:${post.slug}`);
  const { state, formAction, pending, onSubmit } = useCrForm(async (previous, data) => {
    const result = await saveContentAction(previous, data);
    // Keep other unsaved groups mounted while refreshing the saved revision.
    if (result.status === "success") {
      const section = String(data.get("section") ?? "");
      const intent = String(data.get("intent") ?? "draft");
      if (!["draft", "publish"].includes(intent)) {
        if (dirty) data.set("__keepDirty", "1");
      } else if (pageId) {
        const saved = section ? mergePageSection(pageId, baselineCopy, copy, section)! : copy;
        setBaselineCopy(saved);
        if (JSON.stringify(copy) !== JSON.stringify(saved)) data.set("__keepDirty", "1");
      } else {
        const saved = mergeStory(baselinePost, post, section);
        setBaselinePost(saved);
        if (JSON.stringify(post) !== JSON.stringify(saved)) data.set("__keepDirty", "1");
      }
      onSaved(key, result.message); router.refresh();
    }
    return result;
  });
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const close = () => { if (dirty) setConfirmation({ question: "Discard your unsaved edits?", run: onClose }); else onClose(); };
  const editPost = (patch: Partial<JournalPost>) => { setPost((value) => ({ ...value, ...patch })); };
  const editArticle = (field: string, value: unknown) => { setPost((current) => ({ ...current, copy: { ...current.copy, [lang]: { ...current.copy[lang], [field]: value } } })); };
  const confirmMutation = (event: React.FormEvent<HTMLFormElement>) => {
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const intent = submitter?.value;
    const question = intent === "publish" ? "Publish these changes to the website?" : intent === "delete" ? "Move this post to trash? It will disappear from the website." : intent === "reset" ? "Restore the default live text? Your saved draft is kept." : intent === "unpublish" ? "Remove this post from the live website?" : "";
    if (question) {
      event.preventDefault();
      const data = new FormData(event.currentTarget, submitter);
      data.set("__editorForm", formIdentity(event.currentTarget));
      setConfirmation({ question, run: () => startTransition(() => formAction(data)) });
      return;
    }
    onSubmit(event);
  };
  return <section className="cms-editor panel">
    <header className="cms-heading"><div><button className="cms-back" type="button" onClick={close}>← All content</button><h2>{page?.name ?? (entry || starter ? "Edit story" : "New story")}</h2>
      <p>{page ? "Edit website text in English and Sinhala. Save a draft to review, then publish when ready." : "Write a story, select a cover, and publish it to the journal. Both languages are required."}</p></div>
      {(page || entry?.document.published) && <Link href={page?.path ?? `/blog/${post.slug}`} target="_blank" rel="noopener" className="cms-link">View page <ArrowUpRight size={16} /></Link>}</header>
    <div className="cms-toolbar"><div className="cms-language" role="group" aria-label="Editing language"><button type="button" aria-pressed={lang === "en"} onClick={() => setLang("en")}>English</button><button type="button" aria-pressed={lang === "si"} onClick={() => setLang("si")}>සිංහල</button></div>
      {page && <label className="cms-search"><Search size={18} /><input aria-label="Find a text field" placeholder="Find text or a field…" value={query} onChange={(event) => setQuery(event.target.value)} /></label>}</div>
    <form action={formAction} onSubmit={confirmMutation}>
      <input type="hidden" name="key" value={key} /><input type="hidden" name="revision" value={entry?.revision ?? ""} />
      <input type="hidden" name="payload" value={JSON.stringify(pageId ? copy : post)} />
      <datalist id={imageList}>{images.map(image => <option key={image} value={image} />)}</datalist>
      <fieldset disabled={pending} className="cms-fields">
        <legend className="sr-only">{lang === "en" ? "English" : "Sinhala"} content</legend>
        {pageId ? [...new Set(Object.keys(copy[lang]).map(pageFieldGroup))].map(group => {
          const fields = Object.entries(copy[lang]).filter(([key, value]) => pageFieldGroup(key) === group && `${fieldLabel(key)} ${value}`.toLowerCase().includes(query.toLowerCase()));
          if (!fields.length) return null;
          return <details className="cms-field-group" key={`${lang}:${group}`} open={Boolean(query)}><summary>{fieldLabel(group)} <small>{fields.length} fields</small></summary>{fields.map(([field, value]) => <PageCopyField key={`${lang}:${field}`} field={field} value={value} imageList={imageList} onChange={value => setCopy(current => ({ ...current, [lang]: { ...current[lang], [field]: value }, ...(field.startsWith("image.") ? { [lang === "en" ? "si" : "en"]: { ...current[lang === "en" ? "si" : "en"], [field]: value } } : {}) }))} />)}<SectionActions section={`page:${lang}:${group}`} pending={pending} onReset={form => {
            const reset = mergePageSection(pageId, copy, baselineCopy, `page:${lang}:${group}`)!; setCopy(reset);
            if (JSON.stringify(reset) === JSON.stringify(baselineCopy)) editorReset(form);
          }} /></details>;
        }) : <>
          <section className="cms-field-group"><h3>Story details</h3><div className="cms-grid"><label className="cms-field"><span>Web address</span><input value={post.slug} disabled={Boolean(entry || starter)} placeholder="your-story-title" onChange={(event) => editPost({ slug: slugify(event.target.value) })} /><small>Saved addresses stay fixed to protect existing links.</small></label>
          <label className="cms-field"><span>Category</span><RoundedSelect value={post.category} onValueChange={(value) => editPost({ category: value as JournalPost["category"] })}><option value="style">Style</option><option value="artwork">Artwork</option><option value="care">Care</option></RoundedSelect></label></div>
          <label className="cms-field"><span>Cover image</span><input list={imageList} value={post.image} onChange={(event) => editPost({ image: event.target.value })} /><small>Use /images/… or a product photo URL from this site’s storage.</small></label>
          <div className="cms-grid"><label className="cms-field"><span>Image width</span><input type="number" min="1" max="10000" value={post.width} onChange={(event) => editPost({ width: Number(event.target.value) })} /></label><label className="cms-field"><span>Image height</span><input type="number" min="1" max="10000" value={post.height} onChange={(event) => editPost({ height: Number(event.target.value) })} /></label></div>
          <label className="cms-field"><span>Related product address (optional)</span><RoundedSelect value={post.productSlug} onValueChange={(value) => editPost({ productSlug: value })}><option value="">No related product</option>{post.productSlug && !products.some(product => product.slug === post.productSlug) && <option value={post.productSlug}>{post.productSlug}</option>}{products.map(product => <option key={product.slug} value={product.slug}>{product.name}</option>)}</RoundedSelect></label>
          {(entry || starter) && <SectionActions section="story:details" pending={pending} onReset={form => { const reset = mergeStory(post, baselinePost, "story:details"); setPost(reset); if (JSON.stringify(reset) === JSON.stringify(baselinePost)) editorReset(form); }} />}</section>
          <section className="cms-field-group"><h3>{lang === "en" ? "English introduction" : "සිංහල හැඳින්වීම"}</h3>
          {([['title', 'Title'], ['excerpt', 'Short description'], ['imageAlt', 'Image description'], ['lead', 'Introduction']] as const).map(([field, label]) => <label className="cms-field" key={field}><span>{label}</span><textarea rows={field === "lead" ? 4 : 2} value={post.copy[lang][field]} onChange={(event) => editArticle(field, event.target.value)} /></label>)}
          {(entry || starter) && <SectionActions section={`story:${lang}:summary`} pending={pending} onReset={form => { const reset = mergeStory(post, baselinePost, `story:${lang}:summary`); setPost(reset); if (JSON.stringify(reset) === JSON.stringify(baselinePost)) editorReset(form); }} />}</section>
          <section className="cms-field-group"><h3>{lang === "en" ? "Article sections" : "ලිපියේ කොටස්"}</h3>
          {post.copy[lang].sections.map((section, index) => <div className="cms-section" key={`${lang}-${index}`}><label className="cms-field"><span>Section {index + 1} heading</span><input value={section.heading} onChange={(event) => editArticle("sections", post.copy[lang].sections.map((item, position) => position === index ? { ...item, heading: event.target.value } : item))} /></label>
            <label className="cms-field"><span>Paragraphs</span><textarea rows={7} value={section.paragraphs.join("\n\n")} onChange={(event) => editArticle("sections", post.copy[lang].sections.map((item, position) => position === index ? { ...item, paragraphs: event.target.value.split(/\n\s*\n/) } : item))} /><small>Leave a blank line between paragraphs. Text is displayed safely without HTML.</small></label>
            {post.copy[lang].sections.length > 1 && <button className="cms-back" type="button" onClick={event => { editorChanged(event.currentTarget); editArticle("sections", post.copy[lang].sections.filter((_, position) => position !== index)); }}>Remove section</button>}</div>)}
          {post.copy[lang].sections.length < 20 && <button type="button" className="button button-secondary" onClick={event => { editorChanged(event.currentTarget); editArticle("sections", [...post.copy[lang].sections, { heading: "", paragraphs: [""] }]); }}><Plus size={18} /> Add section</button>}
          {(entry || starter) && <SectionActions section={`story:${lang}:body`} pending={pending} onReset={form => { const reset = mergeStory(post, baselinePost, `story:${lang}:body`); setPost(reset); if (JSON.stringify(reset) === JSON.stringify(baselinePost)) editorReset(form); }} />}</section>
        </>}
      </fieldset>
      <div className="cms-save"><div className="cms-save-buttons"><button className="button button-secondary" type="submit" name="intent" value="draft" disabled={pending}>Save draft</button><button className="button button-primary" type="submit" name="intent" value="publish" disabled={pending}>Publish all changes</button>
        {entry && pageId && <button className="cms-back" type="submit" name="intent" value="reset" disabled={pending}>Restore defaults</button>}
        {entry && !pageId && entry.document.published && <button className="cms-back" type="submit" name="intent" value="unpublish" disabled={pending}>Unpublish</button>}
        {(entry || starter) && !pageId && <button className="cms-back" type="submit" name="intent" value="delete" disabled={pending}><Trash2 size={16} /> Move to trash</button>}</div>
        {pending ? <p role="status">Saving…</p> : <ActionStatus state={state} />}
      </div>
    </form>
    {confirmation && <ConfirmDialog question={confirmation.question} onCancel={() => setConfirmation(null)} onConfirm={() => { const run = confirmation.run; setConfirmation(null); run(); }} />}
  </section>;
}

function TrashRestore({ entry }: { entry: ContentEntry }) {
  const { state, formAction, pending, onSubmit } = useCrForm(saveContentAction);
  const router = useRouter();
  useEffect(() => { if (state.status === "success") router.refresh(); }, [state, router]);
  return <form action={formAction} onSubmit={onSubmit}><input type="hidden" name="key" value={entry.key} /><input type="hidden" name="revision" value={entry.revision} /><button type="submit" name="intent" value="restore" className="cms-link" disabled={pending}>Restore draft</button><ActionStatus state={state} /></form>;
}

function ReadyManager({ entries, products }: { entries: ContentEntry[]; products: ContentProductChoice[] }) {
  const [selected, setSelected] = useState<{ page?: ContentPageId; post?: string; fresh?: boolean } | null>(null);
  const [notice, setNotice] = useState("");
  const saved = useCallback((key: string, message: string) => { setNotice(message); if (message.startsWith("Post moved to trash")) setSelected(null); else if (key.startsWith("cms:post:")) setSelected({ post: key.slice(9) }); }, []);
  const entry = selected ? entries.find((item) => item.key === (selected.page ? `cms:page:${selected.page}` : `cms:post:${selected.post}`)) : undefined;
  const starter = journalPosts.find((post) => post.slug === selected?.post);
  const allPosts = new Map(journalPosts.map((post) => [post.slug, post]));
  entries.filter((item) => item.key.startsWith("cms:post:")).forEach((item) => allPosts.set(item.key.slice(9), item.document.draft as JournalPost));
  const closeEditor = () => { setSelected(null); setNotice(""); };
  return <>
    {selected && <EditorDialog title={selected.page ? CONTENT_PAGES.find(page => page.id === selected.page)?.name ?? "Website content" : selected.fresh ? "New story" : "Edit story"} onClose={closeEditor}>
      {notice && <p className="cms-notice" role="status">{notice}</p>}
      <Editor key={selected.page ?? selected.post ?? "new"} entry={entry} pageId={selected.page} starter={starter} products={products} onSaved={saved} onClose={closeEditor} />
    </EditorDialog>}
    {notice && <p className="cms-notice" role="status">{notice}</p>}
    <section className="panel cms-manager"><header className="cms-heading"><div><h2>Website content</h2><p>Your current layouts, with editable text in both languages. Drafts stay private until you publish.</p></div></header>
      <div className="cms-page-list">{CONTENT_PAGES.map((page) => { const saved = entries.find((item) => item.key === `cms:page:${page.id}`); return <button type="button" key={page.id} onClick={() => setSelected({ page: page.id })}><FileText size={20} /><span><strong>{page.name}</strong><small>{page.path}</small></span><em>{saved?.document.published ? "Published" : saved ? "Draft saved" : "Default content"}</em><span aria-hidden="true">→</span></button>; })}</div>
    </section>
    <section className="panel cms-manager"><header className="cms-heading"><div><h2>Journal stories</h2><p>Create, edit, publish, unpublish or restore a story.</p></div><button className="button button-primary" type="button" onClick={() => setSelected({ fresh: true })}><Plus size={18} /> New story</button></header>
      <div className="cms-page-list">{[...allPosts.values()].map((post) => { const saved = entries.find((item) => item.key === `cms:post:${post.slug}`); return <div className="cms-post-row" key={post.slug}>{saved?.document.deleted ? <><span><strong>{post.copy.en.title}</strong><small>In trash</small></span><TrashRestore key={saved.revision} entry={saved} /></> : <button type="button" onClick={() => setSelected({ post: post.slug })}><FileText size={20} /><span><strong>{post.copy.en.title}</strong><small>/blog/{post.slug}</small></span><em>{saved ? saved.document.published ? "Published" : "Draft" : "Published"}</em><span aria-hidden="true">→</span></button>}</div>; })}</div>
    </section>
  </>;
}
export function ContentManager({ entries, products = [] }: { entries: SectionData<ContentEntry[]>; products?: ContentProductChoice[] }) {
  return <SectionGate data={entries}>{(items) => <ReadyManager entries={items} products={products} />}</SectionGate>;
}
