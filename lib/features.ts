function normalized(value: string | undefined) {
  return value?.trim().toLowerCase();
}

export function resolveLaunchMode(value: string | undefined) {
  return normalized(value) !== "off";
}

export function resolveAuthDemoMode(value: string | undefined, nodeEnv: string | undefined) {
  return nodeEnv !== "production" && normalized(value) === "on";
}

/**
 * Member sign-in can open before the store does. `on` opens it during launch
 * mode, `off` keeps it closed after launch, and anything else follows the
 * launch gate. Real sign-in also needs Supabase configured; otherwise the
 * login pages keep showing the coming-soon state instead of failing.
 */
export function resolveAuthEnabled({
  authMode,
  demoMode,
  launchMode,
  supabaseConfigured,
}: {
  authMode: string | undefined;
  demoMode: boolean;
  launchMode: boolean;
  supabaseConfigured: boolean;
}) {
  const mode = normalized(authMode);
  const requested = mode === "on" || (mode !== "off" && !launchMode);
  return requested && (supabaseConfigured || demoMode);
}

// Fail closed. A missing value behaves like "on" so unfinished routes are
// never exposed accidentally by an incomplete production environment.
export const launchMode = resolveLaunchMode(process.env.BRAKMASRA_LAUNCH_MODE);
export const commerceEnabled = !launchMode;

// This never activates in a production build, even if the variable is set.
export const authDemoMode = resolveAuthDemoMode(process.env.AUTH_DEMO_MODE, process.env.NODE_ENV);

export const authEnabled = resolveAuthEnabled({
  authMode: process.env.BRAKMASRA_AUTH_MODE,
  demoMode: authDemoMode,
  launchMode,
  supabaseConfigured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY),
});
