import { AuthApiError, AuthRetryableFetchError } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { isServiceOutage, isSupabaseUnreachable } from "@/lib/auth-errors";

const unreachable = new AuthRetryableFetchError("fetch failed", 0);
const mailerFailure = new AuthRetryableFetchError("Error sending recovery email", 500);
const gatewayTimeout = new AuthRetryableFetchError("HTTP 504", 504);
const badCredentials = new AuthApiError("Invalid login credentials", 400, "invalid_credentials");
const emailRateLimited = new AuthApiError("email rate limit exceeded", 429, "over_email_send_rate_limit");

describe("auth error classification", () => {
  it("treats network failures and 5xx responses as an outage for sign-in", () => {
    expect(isServiceOutage(unreachable)).toBe(true);
    expect(isServiceOutage(mailerFailure)).toBe(true);
    expect(isServiceOutage(gatewayTimeout)).toBe(true);
    expect(isServiceOutage(badCredentials)).toBe(false);
    expect(isServiceOutage(emailRateLimited)).toBe(false);
  });

  it("reports only an unanswered request for sign-up and password reset", () => {
    expect(isSupabaseUnreachable(unreachable)).toBe(true);
    // A failing mailer only fails for one kind of address, so it must stay generic.
    expect(isSupabaseUnreachable(mailerFailure)).toBe(false);
    expect(isSupabaseUnreachable(gatewayTimeout)).toBe(false);
    expect(isSupabaseUnreachable(emailRateLimited)).toBe(false);
    expect(isSupabaseUnreachable(null)).toBe(false);
  });
});
