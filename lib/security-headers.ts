const DEVELOPMENT = "development";

export function createContentSecurityPolicy(nonce: string, nodeEnv = process.env.NODE_ENV) {
  const isDevelopment = nodeEnv === DEVELOPMENT;
  const scriptSources = ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"];
  const styleSources = ["'self'", isDevelopment ? "'unsafe-inline'" : `'nonce-${nonce}'`];

  if (isDevelopment) scriptSources.push("'unsafe-eval'");

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    `script-src ${scriptSources.join(" ")}`,
    `style-src ${styleSources.join(" ")}`,
    "img-src 'self' data:",
    "font-src 'self' data:",
    `connect-src 'self'${isDevelopment ? " ws: wss:" : ""}`,
    "frame-src 'none'",
    "media-src 'self'",
    ...(!isDevelopment ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}
