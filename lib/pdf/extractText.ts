/**
 * Extract plain text from a PDF via the server-side /api/extract-pdf route.
 */
export async function extractPdfText(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/extract-pdf", {
    method: "POST",
    body: formData,
  });

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new Error("Invalid response from PDF extraction service.");
  }

  const parsed = data as { text?: string; error?: string };

  if (!res.ok || parsed.error) {
    throw new Error(
      typeof parsed.error === "string" && parsed.error.length > 0
        ? parsed.error
        : `PDF extraction failed (${res.status}).`,
    );
  }

  if (typeof parsed.text !== "string") {
    throw new Error("PDF extraction returned no text.");
  }

  return parsed.text.replace(/\s+\n/g, "\n").trim();
}
