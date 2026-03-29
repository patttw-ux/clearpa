/**
 * Client-side PDF text extraction for payer detection (browser only).
 */
export async function countPdfPages(file: File): Promise<number> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const text = new TextDecoder("latin1").decode(bytes);
  const matches = text.match(/\/Type\s*\/Page[^s]/g);
  return matches ? matches.length : 0;
}

export async function extractTextFromPDF(file: File): Promise<string> {
  const { getDocument, GlobalWorkerOptions, version } = await import(
    "pdfjs-dist"
  );
  GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.mjs`;

  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await getDocument({ data }).promise;
  const parts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
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

  return parts.join(" ");
}
