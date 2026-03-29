/**
 * Client: POST PDF to /api/extract-pdf and return text + page count.
 */
export async function extractPdfViaApi(
  file: File,
): Promise<{ text: string; pages: number }> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/extract-pdf", {
    method: "POST",
    body: fd,
  });
  if (!res.ok) {
    const t = await res.text();
    let msg = `Request failed (${res.status})`;
    try {
      const j = JSON.parse(t) as { error?: string };
      if (j.error) msg = j.error;
    } catch {
      if (t) msg = t;
    }
    throw new Error(msg);
  }
  const data = (await res.json()) as { text?: unknown; pages?: unknown };
  const text = typeof data.text === "string" ? data.text : "";
  const pages = typeof data.pages === "number" ? data.pages : 0;
  return { text, pages };
}
