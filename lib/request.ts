import type { NextRequest } from "next/server";

type HeaderReader = Pick<Headers, "get">;

function normalizeClientAddress(value: string | null) {
  const candidate = value?.split(",")[0]?.trim();
  if (!candidate || candidate.length > 64 || !/^[\da-f:.]+$/i.test(candidate)) return null;
  return candidate.toLowerCase();
}

export function clientAddress(headers: HeaderReader) {
  // These headers must be overwritten by the production edge or reverse proxy.
  // Provider-specific single-client headers are preferred over the proxy chain.
  return normalizeClientAddress(headers.get("cf-connecting-ip"))
    || normalizeClientAddress(headers.get("x-real-ip"))
    || normalizeClientAddress(headers.get("x-vercel-forwarded-for"))
    || normalizeClientAddress(headers.get("x-forwarded-for"))
    || "unknown";
}

export function requestKey(request: NextRequest, scope: string) {
  return `${scope}:${clientAddress(request.headers)}`;
}

export async function readJsonBody(request: Pick<Request, "body" | "headers">, maxBytes: number) {
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) return null;
  if (!request.body) return null;

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytesRead = 0;
  let body = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytesRead += value.byteLength;
      if (bytesRead > maxBytes) {
        await reader.cancel();
        return null;
      }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
    return JSON.parse(body) as unknown;
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}

export function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === request.nextUrl.origin;
  } catch {
    return false;
  }
}
