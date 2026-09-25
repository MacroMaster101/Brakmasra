"use client";

import { useEffect, useId, useState, useTransition, type ChangeEvent } from "react";
import { Camera, Trash2, Upload, X } from "lucide-react";

import type { AccountActionState } from "@/app/account/actions";
import { removeAvatarAction, uploadAvatarAction } from "@/app/account/avatar-actions";
import { FormStatus } from "@/components/account/form-status";
import { initialAccountState } from "@/components/account/use-account-form";
import { AvatarPhoto } from "@/components/avatar-photo";
import { useLanguage } from "@/components/language-provider";
import { AVATAR_PICK_MAX_BYTES, AVATAR_SIZE, AVATAR_TYPES, AVATAR_UPLOAD_MAX_BYTES } from "@/lib/avatar";
import type { TextKey } from "@/lib/i18n";
import type { AvatarSource, Member } from "@/lib/member";

type AvatarEditorProps = {
  member: Pick<Member, "name" | "email" | "initials" | "avatarUrl">;
  source: AvatarSource | null;
};

type Preview = { url: string; blob: Blob };

function toBlob(canvas: HTMLCanvasElement, type: string) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.86));
}

/**
 * Crops the chosen photo to a centred square and shrinks it in the browser,
 * so large phone photos upload quickly. The server decodes and re-encodes it again.
 */
async function shrinkPhoto(file: File): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const side = Math.min(bitmap.width, bitmap.height);
    const size = Math.min(AVATAR_SIZE, side);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);
    bitmap.close();
    // Older Safari can't write WebP and hands back a PNG; JPEG keeps that small.
    const webp = await toBlob(canvas, "image/webp");
    return webp?.type === "image/webp" ? webp : await toBlob(canvas, "image/jpeg");
  } catch {
    return null;
  }
}

export function AvatarEditor({ member, source }: AvatarEditorProps) {
  const { t } = useLanguage();
  const inputId = useId();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [pickError, setPickError] = useState<TextKey | null>(null);
  const [state, setState] = useState<AccountActionState>(initialAccountState);
  const [pending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<"upload" | "remove" | null>(null);

  // Frees the preview's memory when it is replaced or the page closes.
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview.url);
  }, [preview]);

  const busy = pending;
  const shown = preview?.url ?? member.avatarUrl;
  const sourceLabel: TextKey = preview
    ? "accountPhotoSourceNew"
    : source === "upload"
      ? "accountPhotoSourceUpload"
      : source === "email"
        ? "accountPhotoSourceEmail"
        : "accountPhotoSourceInitials";

  async function onPick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Lets the same file be picked again after Cancel.
    event.target.value = "";
    if (!file) return;

    setState(initialAccountState);
    if (!(AVATAR_TYPES as readonly string[]).includes(file.type)) return setPickError("accountPhotoErrorType");
    if (file.size > AVATAR_PICK_MAX_BYTES) return setPickError("accountPhotoErrorSize");

    const blob = await shrinkPhoto(file);
    if (!blob || blob.size > AVATAR_UPLOAD_MAX_BYTES) return setPickError("accountPhotoErrorRead");
    setPickError(null);
    setPreview({ url: URL.createObjectURL(blob), blob });
  }

  function upload() {
    if (!preview) return;
    const formData = new FormData();
    const extension = preview.blob.type === "image/webp" ? "webp" : "jpg";
    formData.append("avatar", new File([preview.blob], `avatar.${extension}`, { type: preview.blob.type }));
    setPendingAction("upload");
    startTransition(async () => {
      const result = await uploadAvatarAction(initialAccountState, formData);
      setState(result);
      if (result.status === "success") setPreview(null);
      setPendingAction(null);
    });
  }

  function remove() {
    setPendingAction("remove");
    startTransition(async () => {
      setState(await removeAvatarAction());
      setPendingAction(null);
    });
  }

  return (
    <section className="panel account-panel avatar-editor" aria-label={t.accountPhotoTitle}>
      <div className="avatar-editor-visual">
        <AvatarPhoto className="avatar-editor-photo" src={shown} initials={member.initials} />
        <label className="avatar-editor-camera" htmlFor={inputId} aria-label={t.accountPhotoChoose}>
          <Camera aria-hidden="true" />
        </label>
      </div>

      <div className="avatar-editor-body">
        <div className="avatar-editor-identity">
          <div>
            <p className="avatar-editor-name">{member.name}</p>
            <p className="avatar-editor-email">{member.email}</p>
          </div>
          <span className={`avatar-editor-source${preview ? " is-new" : ""}`}>{t[sourceLabel]}</span>
        </div>

        <div className="avatar-editor-actions">
          <input
            id={inputId}
            className="sr-only"
            type="file"
            accept={AVATAR_TYPES.join(",")}
            disabled={busy}
            onChange={onPick}
          />
          {preview ? (
            <>
              <button className="button button-primary avatar-editor-button" type="button" onClick={upload} disabled={busy}>
                <Upload aria-hidden="true" />
                {pendingAction === "upload" ? t.accountPhotoUploading : t.accountPhotoUpload}
              </button>
              <button className="avatar-editor-link" type="button" onClick={() => setPreview(null)} disabled={busy}>
                <X aria-hidden="true" />
                {t.accountPhotoCancel}
              </button>
            </>
          ) : (
            <>
              <label className={`avatar-editor-link${busy ? " is-disabled" : ""}`} htmlFor={inputId}>
                <Camera aria-hidden="true" />
                {t.accountPhotoChoose}
              </label>
              <button
                className="avatar-editor-link is-danger"
                type="button"
                onClick={remove}
                disabled={busy || source !== "upload"}
                title={source === "email" ? t.accountPhotoEmailNote : undefined}
              >
                <Trash2 aria-hidden="true" />
                {pendingAction === "remove" ? t.accountPhotoRemoving : t.accountPhotoRemove}
              </button>
            </>
          )}
        </div>

        <p className="avatar-editor-help">
          {preview ? t.accountPhotoPreviewNote : source === "email" ? t.accountPhotoEmailNote : t.accountPhotoHelp}
        </p>
        {pickError ? (
          <p className="auth-status account-form-status is-error" role="alert">{t[pickError]}</p>
        ) : (
          <FormStatus state={state} />
        )}
      </div>
    </section>
  );
}
