"use client";

import Image from "next/image";
import { useFormStatus } from "react-dom";

type GoogleAuthButtonProps = {
  action: (formData: FormData) => Promise<void>;
  next: string;
  returnTo: "/login" | "/signup";
};

function GoogleSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="google-auth-button" type="submit" disabled={pending}>
      <Image className="google-mark" src="/images/google-g.svg" alt="" width={18} height={18} />
      <span>{pending ? "Opening Google" : "Continue with Google"}</span>
    </button>
  );
}

export function GoogleAuthButton({ action, next, returnTo }: GoogleAuthButtonProps) {
  return (
    <>
      <form className="auth-social" action={action}>
        <input type="hidden" name="next" value={next} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <GoogleSubmitButton />
      </form>
      <div className="auth-divider" aria-hidden="true">
        <span>or continue with email</span>
      </div>
    </>
  );
}
