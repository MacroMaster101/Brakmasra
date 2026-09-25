"use client";

import { startTransition, useActionState, type FormEvent } from "react";

import type { AccountActionState } from "@/app/account/actions";

export type AccountAction = (state: AccountActionState, formData: FormData) => Promise<AccountActionState>;

export const initialAccountState: AccountActionState = { status: "idle", message: "" };

/**
 * Runs the action without React's automatic form reset, so typed values
 * survive an error and the password form can resubmit with the emailed code.
 * `formAction` stays on the form so it still posts without JavaScript.
 */
export function useAccountForm(action: AccountAction) {
  const [state, formAction, pending] = useActionState(action, initialAccountState);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const formData = new FormData(event.currentTarget, submitter);
    startTransition(() => formAction(formData));
  };

  return { state, formAction, pending, onSubmit };
}
