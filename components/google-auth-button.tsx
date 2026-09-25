"use client";

import Image from "next/image";
import { useFormStatus } from "react-dom";

import { useLanguage } from "@/components/language-provider";

type GoogleAuthButtonProps = {
  action: (formData: FormData) => Promise<void>;
  next: string;
  returnTo: "/login" | "/signup";
};

function GoogleSubmitButton() {
  const { t } = useLanguage();
  const { pending } = useFormStatus();

  return (
    <button className="google-auth-button" type="submit" disabled={pending}>
      <Image className="google-mark" src="/images/google-g.svg" alt="" width={18} height={18} />
      <span>{pending ? t.authGoogleOpening : t.authGoogleContinue}</span>
    </button>
  );
}

export function GoogleAuthButton({ action, next, returnTo }: GoogleAuthButtonProps) {
  const { t } = useLanguage();

  return (
    <>
      <form className="auth-social" action={action}>
        <input type="hidden" name="next" value={next} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <GoogleSubmitButton />
      </form>
      <div className="auth-divider" aria-hidden="true">
        <span>{t.authEmailDivider}</span>
      </div>
    </>
  );
}
