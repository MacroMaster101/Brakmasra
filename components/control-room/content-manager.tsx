"use client";
import { startTransition, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, FileText, Plus, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { saveContentAction } from "@/app/admin/content-actions";
import { SectionGate, ActionStatus } from "@/components/control-room/shared";
import { useCrForm } from "@/components/control-room/store-shared";
import { ConfirmDialog } from "@/components/control-room/confirm-dialog";
import { CONTENT_PAGES, fieldLabel, pageDefaults, type ContentPageId, type CopyValues } from "@/lib/content-fields";
import type { ContentEntry } from "@/lib/content";
import type { SectionData } from "@/lib/control-room-validation";
import { journalPosts, type JournalPost } from "@/data/journal";
import { slugify } from "@/lib/store-admin-validation";

const blankPost = (): JournalPost => ({ slug: "", category: "style", image: "/images/about/courtyard-campaign.webp", width: 1448, height: 1086, productSlug: "", copy: {
  en: { title: "", excerpt: "", imageAlt: "", lead: "", sections: [{ heading: "", paragraphs: [""] }] },
  si: { title: "", excerpt: "", imageAlt: "", lead: "", sections: [{ heading: "", paragraphs: [""] }] },
} });

function Editor({ entry, pageId, starter, onClose, onSaved }: { entry?: ContentEntry; pageId?: ContentPageId; starter?: JournalPost; onClose: () => void; onSaved: (key: string, message: string) => void }) {
  const router = useRouter();
  const [lang, setLang] = useState<"en" | "si">("en");
  const [query, setQuery] = useState("");
  const [copy, setCopy] = useState<CopyValues>(() => pageId ? entry?.document.draft as CopyValues ?? pageDefaults(pageId) : { en: {}, si: {} });
  const [post, setPost] = useState<JournalPost>(() => !pageId ? entry?.document.draft as JournalPost ?? starter ?? blankPost() : blankPost());
  const [dirty, setDirty] = useState(false);
  const [confirmation, setConfirmation] = useState<{ question: string; run: () => void } | null>(null);
  const page = CONTENT_PAGES.find((item) => item.id === pageId);
  const key = entry?.key ?? (pageId ? `cms:page:${pageId}` : `cms:post:${post.slug}`);
  const { state, formAction, pending, onSubmit } = useCrForm(async (previous, data) => {
    const result = await saveContentAction(previous, data);
    // A server save refreshes the entry's revision and remounts the editor.
    // Notify the parent in the action continuation, before that state is lost.
    if (result.status === "success") { onSaved(key, result.message); router.refresh(); }
    return result;
  });
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const close = () => { if (dirty) setConfirmation({ question: "Discard your unsaved edits?", run: onClose }); else onClose(); };
  const editPost = (patch: Partial<JournalPost>) => { setPost((value) => ({ ...value, ...patch })); setDirty(true); };
  const editArticle = (field: string, value: unknown) => { setPost((current) => ({ ...current, copy: { ...current.copy, [lang]: { ...current.copy[lang], [field]: value } } })); setDirty(true); };
  const confirmMutation = (event: React.FormEvent<HTMLFormElement>) => {
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const intent = submitter?.value;
    const question = intent === "publish" ? "Publish these changes to the website?" : intent === "delete" ? "Move this post to trash? It will disappear from the website." : intent === "reset" ? "Restore the default live text? Your saved draft is kept." : intent === "unpublish" ? "Remove this post from the live website?" : "";
    if (question) {
      event.preventDefault();
      const data = new FormData(event.currentTarget, submitter);
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
      <fieldset disabled={pending} className="cms-fields">
        <legend className="sr-only">{lang === "en" ? "English" : "Sinhala"} content</legend>
        {pageId ? Object.entries(copy[lang]).filter(([key, value]) => `${fieldLabel(key)} ${key} ${value}`.toLowerCase().includes(query.toLowerCase())).map(([field, value]) => <label className="cms-field" key={`${lang}-${field}`}><span>{fieldLabel(field)}</span><textarea rows={value.length > 150 ? 4 : 2} maxLength={10000} value={value} onChange={(event) => { setCopy((current) => ({ ...current, [lang]: { ...current[lang], [field]: event.target.value }, ...(field.startsWith("image.") ? { [lang === "en" ? "si" : "en"]: { ...current[lang === "en" ? "si" : "en"], [field]: event.target.value } } : {}) })); setDirty(true); }} /></label>) : <>
          <div className="cms-grid"><label className="cms-field"><span>Web address</span><input value={post.slug} disabled={Boolean(entry || starter)} placeholder="your-story-title" onChange={(event) => editPost({ slug: slugify(event.target.value) })} /><small>Saved addresses stay fixed to protect existing links.</small></label>
          <label className="cms-field"><span>Category</span><select value={post.category} onChange={(event) => editPost({ category: event.target.value as JournalPost["category"] })}><option value="style">Style</option><option value="artwork">Artwork</option><option value="care">Care</option></select></label></div>
          <label className="cms-field"><span>Cover image</span><input value={post.image} onChange={(event) => editPost({ image: event.target.value })} /><small>Use /images/… or a product photo URL from this site’s storage.</small></label>
          <div className="cms-grid"><label className="cms-field"><span>Image width</span><input type="number" min="1" max="10000" value={post.width} onChange={(event) => editPost({ width: Number(event.target.value) })} /></label><label className="cms-field"><span>Image height</span><input type="number" min="1" max="10000" value={post.height} onChange={(event) => editPost({ height: Number(event.target.value) })} /></label></div>
          <label className="cms-field"><span>Related product address (optional)</span><input value={post.productSlug} onChange={(event) => editPost({ productSlug: event.target.value })} /></label>
          {([['title', 'Title'], ['excerpt', 'Short description'], ['imageAlt', 'Image description'], ['lead', 'Introduction']] as const).map(([field, label]) => <label className="cms-field" key={field}><span>{label}</span><textarea rows={field === "lead" ? 4 : 2} value={post.copy[lang][field]} onChange={(event) => editArticle(field, event.target.value)} /></label>)}
          {post.copy[lang].sections.map((section, index) => <div className="cms-section" key={`${lang}-${index}`}><label className="cms-field"><span>Section {index + 1} heading</span><input value={section.heading} onChange={(event) => editArticle("sections", post.copy[lang].sections.map((item, position) => position === index ? { ...item, heading: event.target.value } : item))} /></label>
            <label className="cms-field"><span>Paragraphs</span><textarea rows={7} value={section.paragraphs.join("\n\n")} onChange={(event) => editArticle("sections", post.copy[lang].sections.map((item, position) => position === index ? { ...item, paragraphs: event.target.value.split(/\n\s*\n/) } : item))} /><small>Leave a blank line between paragraphs. Text is displayed safely without HTML.</small></label>
            {post.copy[lang].sections.length > 1 && <button className="cms-back" type="button" onClick={() => editArticle("sections", post.copy[lang].sections.filter((_, position) => position !== index))}>Remove section</button>}</div>)}
          {post.copy[lang].sections.length < 20 && <button type="button" className="button button-secondary" onClick={() => editArticle("sections", [...post.copy[lang].sections, { heading: "", paragraphs: [""] }])}><Plus size={18} /> Add section</button>}
        </>}
      </fieldset>
      <div className="cms-save"><div className="cms-save-buttons"><button className="button button-secondary" type="submit" name="intent" value="draft" disabled={pending}>Save draft</button><button className="button button-primary" type="submit" name="intent" value="publish" disabled={pending}>Publish changes</button>
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

function ReadyManager({ entries }: { entries: ContentEntry[] }) {
  const [selected, setSelected] = useState<{ page?: ContentPageId; post?: string; fresh?: boolean } | null>(null);
  const [notice, setNotice] = useState("");
  const saved = useCallback((key: string, message: string) => { setNotice(message); if (message.startsWith("Post moved to trash")) setSelected(null); else if (key.startsWith("cms:post:")) setSelected({ post: key.slice(9) }); }, []);
  const entry = selected ? entries.find((item) => item.key === (selected.page ? `cms:page:${selected.page}` : `cms:post:${selected.post}`)) : undefined;
  const starter = journalPosts.find((post) => post.slug === selected?.post);
  const allPosts = new Map(journalPosts.map((post) => [post.slug, post]));
  entries.filter((item) => item.key.startsWith("cms:post:")).forEach((item) => allPosts.set(item.key.slice(9), item.document.draft as JournalPost));
  if (selected) return <>{notice && <p className="cms-notice" role="status">{notice}</p>}<Editor key={`${selected.page ?? selected.post ?? "new"}:${entry?.revision ?? "initial"}`} entry={entry} pageId={selected.page} starter={starter} onSaved={saved} onClose={() => { setSelected(null); setNotice(""); }} /></>;
  return <>
    {notice && <p className="cms-notice" role="status">{notice}</p>}
    <section className="panel cms-manager"><header className="cms-heading"><div><h2>Website content</h2><p>Your current layouts, with editable text in both languages. Drafts stay private until you publish.</p></div></header>
      <div className="cms-page-list">{CONTENT_PAGES.map((page) => { const saved = entries.find((item) => item.key === `cms:page:${page.id}`); return <button type="button" key={page.id} onClick={() => setSelected({ page: page.id })}><FileText size={20} /><span><strong>{page.name}</strong><small>{page.path}</small></span><em>{saved?.document.published ? "Published" : saved ? "Draft saved" : "Default content"}</em><span aria-hidden="true">→</span></button>; })}</div>
    </section>
    <section className="panel cms-manager"><header className="cms-heading"><div><h2>Journal stories</h2><p>Create, edit, publish, unpublish or restore a story.</p></div><button className="button button-primary" type="button" onClick={() => setSelected({ fresh: true })}><Plus size={18} /> New story</button></header>
      <div className="cms-page-list">{[...allPosts.values()].map((post) => { const saved = entries.find((item) => item.key === `cms:post:${post.slug}`); return <div className="cms-post-row" key={post.slug}>{saved?.document.deleted ? <><span><strong>{post.copy.en.title}</strong><small>In trash</small></span><TrashRestore key={saved.revision} entry={saved} /></> : <button type="button" onClick={() => setSelected({ post: post.slug })}><FileText size={20} /><span><strong>{post.copy.en.title}</strong><small>/blog/{post.slug}</small></span><em>{saved ? saved.document.published ? "Published" : "Draft" : "Published"}</em><span aria-hidden="true">→</span></button>}</div>; })}</div>
    </section>
  </>;
}
export function ContentManager({ entries }: { entries: SectionData<ContentEntry[]> }) {
  return <SectionGate data={entries}>{(items) => <ReadyManager entries={items} />}</SectionGate>;
}
