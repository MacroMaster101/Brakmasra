export async function readResponseMessage(response: Response, fallback: string) {
  try {
    const body: unknown = await response.json();
    if (
      body
      && typeof body === "object"
      && "message" in body
      && typeof body.message === "string"
    ) {
      return body.message;
    }
  } catch {
    // Use the caller's safe message for empty and non-JSON responses.
  }
  return fallback;
}
