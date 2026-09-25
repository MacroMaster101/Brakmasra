import { isAuthRetryableFetchError } from "@supabase/supabase-js";

function statusOf(error: unknown) {
  return typeof error === "object" && error && "status" in error && typeof error.status === "number"
    ? error.status
    : undefined;
}

/**
 * Network failures and Supabase 5xx responses. Safe to report on sign-in,
 * where a wrong password gives the same answer whether or not the account
 * exists, so an outage must not be shown as "email or password is incorrect".
 */
export function isServiceOutage(error: unknown) {
  if (isAuthRetryableFetchError(error)) return true;
  const status = statusOf(error);
  return status !== undefined && status >= 500;
}

/**
 * The request never got an answer from Supabase (network, DNS, connection
 * refused). This is the only failure that says nothing about the account.
 * Sign-up and password reset must not report 5xx responses: Supabase sends
 * email for only one kind of address (new sign-ups, existing members for
 * reset), so a failing mailer's 5xx would reveal whether an account exists.
 */
export function isSupabaseUnreachable(error: unknown) {
  return isAuthRetryableFetchError(error) && statusOf(error) === 0;
}
