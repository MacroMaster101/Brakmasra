function normalized(value: string | undefined) {
  return value?.trim().toLowerCase();
}

export function resolveLaunchMode(value: string | undefined) {
  return normalized(value) !== "off";
}

export function resolveAuthDemoMode(value: string | undefined, nodeEnv: string | undefined) {
  return nodeEnv !== "production" && normalized(value) === "on";
}

// Fail closed. A missing value behaves like "on" so unfinished routes are
// never exposed accidentally by an incomplete production environment.
export const launchMode = resolveLaunchMode(process.env.BRAKMASRA_LAUNCH_MODE);
export const authEnabled = !launchMode;
export const commerceEnabled = !launchMode;

// This never activates in a production build, even if the variable is set.
export const authDemoMode = resolveAuthDemoMode(process.env.AUTH_DEMO_MODE, process.env.NODE_ENV);
