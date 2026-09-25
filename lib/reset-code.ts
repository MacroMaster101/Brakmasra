// Client-safe settings for the password reset code flow.

/** Must match Supabase > Sign In / Providers > Email > "Email OTP Length". */
export const RESET_CODE_LENGTH = 6;

/** Matches Supabase's per-user minimum interval between emails (SMTP settings). */
export const RESEND_COOLDOWN_SECONDS = 60;
