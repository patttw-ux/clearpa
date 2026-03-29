/**
 * Parse PDF bytes into text and page count (Node + browser compatible).
 */
export async function parsePdfBuffer(
  buffer: ArrayBuffer,
): Promise<{ text: string; pages: number }> {
  const { getDocument, GlobalWorkerOptions, version } = await import(
    "pdfjs-dist"
  );
  GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.mjs`;

  const data = new Uint8Array(buffer);
  const pdf = await getDocument({ data }).promise;
  const pages = pdf.numPages;
  const parts: string[] = [];

  for (let i = 1; i <= pages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    for (const item of content.items) {
      if (typeof item === "object" && item !== null && "str" in item) {
        const s = String((item as { str: string }).str);
        if (s) parts.push(s);
      }
    }
    parts.push("\n");
  }

  return { text: parts.join(" "), pages };
}
