"use client";

import { useId, useState, useTransition, type ChangeEvent } from "react";
import { ArrowDown, ArrowUp, ImagePlus } from "lucide-react";

import type { ControlRoomActionState } from "@/app/admin/actions";
import {
  deleteProductImageAction,
  moveProductImageAction,
  updateProductImageAltAction,
  uploadProductImageAction,
} from "@/app/admin/store-actions";
import { ActionStatus } from "@/components/control-room/shared";
import { DeleteForm, idleState, useCrForm } from "@/components/control-room/store-shared";
import { useLanguage } from "@/components/language-provider";
import { AVATAR_PICK_MAX_BYTES, AVATAR_TYPES, AVATAR_UPLOAD_MAX_BYTES } from "@/lib/avatar";
import type { AdminImage } from "@/lib/store-admin";
import { MAX_PRODUCT_IMAGES } from "@/lib/store-admin-validation";

const PHOTO_SIZE = 1600;

/** Shrinks a photo in the browser so large phone pictures upload fast; the server re-encodes it again. */
async function shrinkPhoto(file: File): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, PHOTO_SIZE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const encode = (type: string, quality: number) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
    for (const quality of [0.86, 0.72, 0.6]) {
      const webp = await encode("image/webp", quality);
      const blob = webp?.type === "image/webp" ? webp : await encode("image/jpeg", quality);
      if (blob && blob.size <= AVATAR_UPLOAD_MAX_BYTES) return blob;
    }
    return null;
  } catch {
    return null;
  }
}

function PhotoAlt({ image }: { image: AdminImage }) {
  const { t } = useLanguage();
  const { state, formAction, pending, onSubmit } = useCrForm(updateProductImageAltAction);
  return (
    <form className="crs-photo-alt" action={formAction} onSubmit={onSubmit}>
      <input type="hidden" name="id" value={image.id} />
      <label>
        <span className="sr-only">{t.crsPhotoAlt}</span>
        <input name="altText" required minLength={2} maxLength={160} defaultValue={image.altText} placeholder={t.crsPhotoAlt} />
      </label>
      <button className="button button-secondary" type="submit" disabled={pending}>{pending ? t.crSaving : t.crSave}</button>
      <ActionStatus state={state} />
    </form>
  );
}

function MoveButtons({ image, first, last }: { image: AdminImage; first: boolean; last: boolean }) {
  const { t } = useLanguage();
  const { formAction, pending, onSubmit } = useCrForm(moveProductImageAction);
  return (
    <form className="crs-photo-move" action={formAction} onSubmit={onSubmit}>
      <input type="hidden" name="id" value={image.id} />
      <button type="submit" name="direction" value="up" disabled={pending || first} aria-label={t.crsMoveUp} title={t.crsMoveUp}>
        <ArrowUp aria-hidden="true" />
      </button>
      <button type="submit" name="direction" value="down" disabled={pending || last} aria-label={t.crsMoveDown} title={t.crsMoveDown}>
        <ArrowDown aria-hidden="true" />
      </button>
    </form>
  );
}

export function ProductPhotos({ productId, images, canManage }: { productId: string; images: AdminImage[]; canManage: boolean }) {
  const { t } = useLanguage();
  const inputId = useId();
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<ControlRoomActionState>(idleState);
  const full = images.length >= MAX_PRODUCT_IMAGES;

  async function onPick(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])].slice(0, MAX_PRODUCT_IMAGES - images.length);
    event.target.value = "";
    if (!files.length) return;

    startTransition(async () => {
      let result: ControlRoomActionState = idleState;
      for (const file of files) {
        if (!(AVATAR_TYPES as readonly string[]).includes(file.type)) {
          result = { status: "error", message: "Use a PNG, JPEG, or WebP image." };
          break;
        }
        if (file.size > AVATAR_PICK_MAX_BYTES) {
          result = { status: "error", message: "That photo is too large. Try a smaller one." };
          break;
        }
        const blob = await shrinkPhoto(file);
        if (!blob) {
          result = { status: "error", message: "That image could not be processed. Try a different file." };
          break;
        }
        const formData = new FormData();
        formData.append("productId", productId);
        formData.append("photo", new File([blob], blob.type === "image/webp" ? "photo.webp" : "photo.jpg", { type: blob.type }));
        result = await uploadProductImageAction(idleState, formData);
        if (result.status === "error") break;
      }
      setState(result);
    });
  }

  return (
    <section className="panel cr-panel crs-photos" aria-labelledby="crs-photos-title">
      <header className="cr-panel-heading">
        <div>
          <h2 id="crs-photos-title">{t.crsPhotosTitle}</h2>
          <p>{t.crsPhotosDesc}</p>
        </div>
        {canManage && (
          <div className="crs-photo-add">
            <input
              id={inputId}
              className="sr-only"
              type="file"
              multiple
              accept={AVATAR_TYPES.join(",")}
              disabled={pending || full}
              onChange={onPick}
            />
            <label className={`button button-primary${pending || full ? " is-disabled" : ""}`} htmlFor={inputId} aria-disabled={pending || full}>
              <ImagePlus aria-hidden="true" />
              {pending ? t.accountPhotoUploading : t.crsAddPhotos}
            </label>
          </div>
        )}
      </header>
      <ActionStatus state={state} />
      {images.length === 0
        ? <p className="crs-legend-note">{t.crsNoPhotos}</p>
        : (
          <ol className="crs-photo-list">
            {images.map((image, index) => (
              <li key={image.id} className="crs-photo">
                {/* eslint-disable-next-line @next/next/no-img-element -- stored WebP or a local file shown at its own size. */}
                <img src={image.url} alt={image.altText} loading="lazy" decoding="async" />
                {index === 0 && <span className="crs-photo-cover">{t.crsCoverPhoto}</span>}
                {canManage
                  ? (
                    <div className="crs-photo-tools">
                      <PhotoAlt image={image} />
                      <div className="crs-photo-row">
                        <MoveButtons image={image} first={index === 0} last={index === images.length - 1} />
                        <DeleteForm action={deleteProductImageAction} id={image.id} confirm="crsDeletePhotoConfirm" label="crsRemove" compact />
                      </div>
                    </div>
                  )
                  : <p className="crs-photo-caption">{image.altText}</p>}
              </li>
            ))}
          </ol>
        )}
      <p className="crs-hint">{t.crsPhotosHint}</p>
    </section>
  );
}
