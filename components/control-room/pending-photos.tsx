"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { ArrowDown, ArrowUp, ImagePlus, X } from "lucide-react";

import { useLanguage } from "@/components/language-provider";
import { AVATAR_TYPES } from "@/lib/avatar";
import { moveInList, photoRole, preparePhoto } from "@/lib/product-photo-upload";
import { MAX_PRODUCT_IMAGES } from "@/lib/store-admin-validation";

export type PendingPhoto = { id: number; file: File };

/** Shows a chosen file. The effect owns the temporary address so it is always released. */
function Preview({ file }: { file: File }) {
  const image = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const url = URL.createObjectURL(file);
    if (image.current) image.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);
  // eslint-disable-next-line @next/next/no-img-element -- a local file that has not been uploaded yet.
  return <img ref={image} alt="" decoding="async" />;
}

/** Photos for a product that does not exist yet; the form uploads them once it is created. */
export function PendingPhotos({ photos, onChange, disabled }: { photos: PendingPhoto[]; onChange: (photos: PendingPhoto[]) => void; disabled: boolean }) {
  const { t } = useLanguage();
  const inputId = useId();
  const nextId = useRef(0);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState("");
  const full = photos.length >= MAX_PRODUCT_IMAGES;
  const locked = disabled || preparing || full;

  async function onPick(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])].slice(0, MAX_PRODUCT_IMAGES - photos.length);
    event.target.value = "";
    if (!files.length) return;
    setPreparing(true);
    setError("");
    const added: PendingPhoto[] = [];
    for (const file of files) {
      const prepared = await preparePhoto(file);
      if (typeof prepared === "string") {
        setError(prepared);
        break;
      }
      added.push({ id: nextId.current++, file: prepared });
    }
    onChange([...photos, ...added]);
    setPreparing(false);
  }

  return (
    <fieldset className="crs-fieldset crs-photos" disabled={disabled}>
      <legend>{t.crsPhotosTitle}</legend>
      <div className="crs-section-fields">
        <p className="crs-legend-note">{t.crsPhotosDesc}</p>
        <div className="crs-photo-add">
          {/* No name: files upload after the product is saved, not with its details. */}
          <input id={inputId} className="sr-only" type="file" multiple accept={AVATAR_TYPES.join(",")} disabled={locked} onChange={onPick} />
          <label className={`button button-secondary${locked ? " is-disabled" : ""}`} htmlFor={inputId} aria-disabled={locked}>
            <ImagePlus aria-hidden="true" />
            {preparing ? t.accountPhotoUploading : t.crsAddPhotos}
          </label>
        </div>
        {error && <p className="crs-photo-error" role="alert">{error}</p>}
        {photos.length > 0 && (
          <ol className="crs-photo-list">
            {photos.map(({ id, file }, index) => {
              const role = photoRole(index);
              return (
                <li key={id} className="crs-photo">
                  <Preview file={file} />
                  {role && <span className="crs-photo-cover">{t[role]}</span>}
                  <div className="crs-photo-row">
                    <div className="crs-photo-move">
                      <button type="button" disabled={index === 0} aria-label={t.crsMoveUp} title={t.crsMoveUp} onClick={() => onChange(moveInList(photos, index, "up"))}><ArrowUp aria-hidden="true" /></button>
                      <button type="button" disabled={index === photos.length - 1} aria-label={t.crsMoveDown} title={t.crsMoveDown} onClick={() => onChange(moveInList(photos, index, "down"))}><ArrowDown aria-hidden="true" /></button>
                    </div>
                    <div className="crs-photo-move">
                      <button type="button" aria-label={t.crsRemove} title={t.crsRemove} onClick={() => onChange(photos.filter((photo) => photo.id !== id))}><X aria-hidden="true" /></button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        <p className="crs-hint">{t.crsPhotosHint}</p>
      </div>
    </fieldset>
  );
}
