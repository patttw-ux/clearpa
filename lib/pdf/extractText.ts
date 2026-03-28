/**
 * Extract plain text from a PDF in the browser (pdfjs-dist).
 */
export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const version = pdfjs.version;

  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;

  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data }).promise;

  const parts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const line = content.items
      .map((item) => {
        if (item && typeof item === "object" && "str" in item) {
          return (item as { str: string }).str;
        }
        return "";
      })
      .join(" ");
    parts.push(line);
  }

  return parts.join("\n\n").replace(/\s+\n/g, "\n").trim();
}
